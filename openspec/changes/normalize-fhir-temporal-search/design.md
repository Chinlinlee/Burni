## Context

目前 FHIR primitive schema 對 `date` 與 `dateTime` 主要保存 string，`instant` 與多個 resource temporal field 則保存 BSON Date；部分歷史資料也可能由 native Mongo collection 直接寫入，形成同一路徑的 mixed BSON types。現有 date query builder 對 year/month precision 的 ordered comparator 使用錯誤的 day boundary，且 dateTime query 會遺失時間與 timezone 語意。

本設計依 proposal.md 與 temporal storage、FHIRPath Mongo query delta specs 建立新的 persistence/query boundary。FHIR API 的 resource JSON contract 不變，改變的是內部 canonical representation、normalization pipeline 和 search projection。

## Goals / Non-Goals

**Goals:**

- 讓每個 temporal datatype 有明確、可驗證且不混用的 canonical representation。
- 保留原始 FHIR lexical value、timezone offset、fractional trailing zeros 與 precision。
- 以 deterministic UTC normalization 支援 dateTime／instant 的高精度比較。
- 將 FHIR date search precision 轉換為正確的 `[start, end)` range。
- 讓 `.find()`、aggregate、history、contained、choice 與 array query 共用相同 temporal semantics。
- 以 generator、migration、schema validation、serializer 和 tests 維持單一 contract。

**Non-Goals:**

- 不將 canonical temporal object 暴露為 public FHIR JSON。
- 不在 runtime 長期支援 migration 完成後的 legacy mixed-type query。
- 不以 normalized value 取代原始 FHIR lexical value。
- 不將 `instant` 降級為 calendar date 或與 `date`／`dateTime` 共用 query semantics。
- 不在本 change 內重新定義 FHIR resource 的非 temporal search behavior。

## Decisions

### 1. 依 datatype 分離 canonical object

`date` 使用 calendar domain 的字串 boundaries：

```text
value: 原始 FHIR string
precision: year | month | day
normalizedStart: YYYY-MM-DD
normalizedEnd: YYYY-MM-DD
```

`dateTime` 使用 UTC Decimal128 epoch seconds boundaries：

```text
value: 原始 FHIR string
precision: year | month | day | minute | second | fraction
fractionDigits: fractional seconds 存在時使用
normalizedStart: Decimal128
normalizedEnd: Decimal128
```

`instant` 使用獨立的 absolute-time object：

```text
value: 原始 FHIR string
precision: second | fraction
fractionDigits: fractional seconds 存在時使用
epochSeconds: Decimal128
```

選擇 type-specific model，是為了避免把沒有 timezone 的 calendar date 誤解為 instant，也避免讓同一個 dateTime path 在 partial value 與完整時間之間使用不同 BSON type。將所有值都存成 string 會無法可靠比較不同 offset；全部使用 BSON Date 則無法表達 calendar-only value 與 millisecond 以上的 precision。Decimal128 可同時維持同一 temporal type 的 BSON type 一致性與高精度排序。

### 2. 原始值與 normalized value 分離

寫入流程先驗證 FHIR scalar，再由集中式 temporal normalizer 產生 canonical object。`value` 永遠保存原始輸入；normalized fields 只供 persistence、index 和 query。serializer 只取 `value` 還原 FHIR scalar，不從 Decimal128 反向格式化 response。

這可避免 UTC conversion、zero-fill、Mongo cast 或 date library formatting 破壞原始 offset、尾端零與 precision。

### 3. 使用 UTC 作為無 timezone dateTime 的 deterministic policy

沒有 timezone 的 `dateTime` 使用 UTC 解讀；帶 offset 的 `dateTime` 與 `instant` 先轉換成 UTC epoch seconds。這是 Burni 的明確 implementation policy，因為依作業系統 local timezone 會使不同部署環境對相同資料產生不同 query 結果。原始 offset 不另外複製到 normalized fields，而由 `value` 保留。

### 4. Query parser 先建立 range，再投影到儲存欄位

Query parser 保持 public FHIR search syntax，解析 comparator、precision、timezone 和 fractional value 後產生 temporal query value。對 `date`／`dateTime`，query value 是 `[queryStart, queryEnd)`；對 `instant`，query builder 使用 Decimal128 `epochSeconds` 的 point semantics。

Comparator 由 query range 與 target range 的 FHIR R4 semantics 推導，不為 year/month precision 寫固定的 day-level shortcut。`ap` 使用明確的 deterministic approximation policy，預設採用 FHIR R4 建議的 10% 時間差距規則。

### 5. Period 與 array 保留結構關聯

Period 的 start/end 先各自轉成 temporal boundaries，再組合成一個完整 interval；缺少 start/end 分別代表負無限／正無限。不得使用互相獨立的 start/end `$or` 條件。

Temporal array 的 start/end 或其他條件必須在同一 element 內套用，使用 `$elemMatch` 或等價的 element-correlated filter，避免不同 array element 的條件被錯誤組合。

### 6. Public normalization 與 persistence schema 分層

Create、update、Bundle write 和 migration 共用同一個 temporal normalization contract。Mongoose schema 驗證 canonical object 的欄位與型別，但不負責把 public FHIR scalar 轉成 object。Read、search response、history、include、revinclude 與 contained resource 共用 unwrap/serialization contract。

選擇集中式 normalization，而不是僅使用 Mongoose setter，是為了確保 direct write、`$set`、history snapshot、aggregate 與 migration 不會得到不同資料形狀。

### 7. Generator、resource schema 與 migration 的順序

`PrimitiveGenerator.js` 是 temporal schema 的 source of truth。先更新 generator，再重新產生所有 resource、datatype、choice、nested 與 history schema；每次 generator 或相關 schema 變更後重新執行 generator 並檢查 diff。

Migration 先掃描並驗證資料，再將合法 legacy string／BSON Date 轉換為 canonical object。absolute-time field 的 legacy BSON Date 以 UTC canonical value 轉換；`date` field 的 BSON Date 若無法無歧義推導 calendar date，migration fail-fast 並回報 path/value。Migration 不加入 legacy source marker，也不靜默猜測或修正 invalid value。

Migration 完成後才啟用只讀 canonical schema 和 normalized query path；不保留 legacy mixed-type query fallback。

### 8. Index 由有效 extraction path 驅動

只對有效 SearchParameter 實際使用的 temporal extraction path 建立 normalized index。`date` index 使用 calendar normalized boundaries；`dateTime` index 使用 Decimal128 normalized boundaries；`instant` index 使用 Decimal128 `epochSeconds`。Index manifest 必須與 Resource type map／SearchParameter extraction path 對齊，不建立無對應搜尋需求的全域 temporal indexes。

### 9. `.find()` 與 aggregate 共用 filter contract

Temporal filter 由同一個 typed query representation 產生，再交給不同 execution mode 使用。`.find()` 不依賴 Mongoose 對 raw query 的 cast；aggregate 也不另行解析 FHIR query string。兩者都直接使用 canonical normalized fields、固定 BSON types 和相同 interval boundaries。

## Risks / Trade-offs

- **[Risk]** legacy BSON Date 無法還原原始 offset、尾端零或真正 lexical precision。→ Migration 產生 canonical UTC value；無法無歧義轉換的 `date` value fail-fast，並要求 migration report 可定位問題。
- **[Risk]** Decimal128 epoch seconds 增加 schema、query parser、index 與測試複雜度。→ 將 dateTime 與 instant query 分成 typed builders，並用共用 range contract 驗證所有 precision。
- **[Risk]** UTC policy 與某些部署對 local timezone 的既有假設不同。→ 將 UTC 寫入 normalization contract、文件與 deterministic tests，不讀取作業系統 timezone。
- **[Risk]** Period、choice、array 與 contained resource 的 path 數量很大。→ 由 Resource type map 和 SearchParameter extraction paths 驅動 schema、projection、index manifest 與 acceptance matrix。
- **[Risk]** migration 中途失敗可能造成部分資料已轉換。→ migration 先做 preflight validation，採可重跑的 idempotent conversion、批次記錄與可恢復的 deployment backup；canonical document 再次執行時不得重複包裝。
- **[Risk]** `$elemMatch` 與 Decimal128 range query 的 index 效能可能因 array shape 而不同。→ 以代表性 array／Period fixture 做 explain 與 hit-set regression；只對實際需要的 extraction paths 建立 indexes。
- **[Risk]** generator 重產可能改動非 temporal generated output。→ 每次 generator 後檢查完整 diff，將非預期 diff 視為 gate failure。

## Migration Plan

1. 更新 proposal 對應的 schema contract、temporal normalizer、query representation 與 generator 設計。
2. 更新 generator 與所有 temporal datatype/resource/history/nested schema，執行 generator 並驗證產物。
3. 建立 read-only preflight，掃描所有 catalog resource、contained resource、choice branch、history model 與 temporal array，分類合法 string、absolute BSON Date、ambiguous BSON Date 與 invalid value。
4. 修正或移除 preflight 回報的 invalid／ambiguous資料後，執行可重跑 migration，將資料轉為 canonical object。
5. 建立並驗證由 extraction path 驅動的 normalized indexes。
6. 啟用 scalar-to-object write normalization、canonical-only schema validation 與 normalized temporal query projection。
7. 執行 temporal acceptance matrix，包含 FHIR response lexical round-trip、所有 comparator／precision、Period、array、missing、history、contained、`.find()` 與 aggregate。
8. 完成 cutover 後移除 legacy mixed-type query fallback；若 cutover gate 失敗，停止啟用新 runtime，使用 migration backup／snapshot 還原資料與舊版本。

## Open Questions

無。所有會影響 persistence representation、FHIR behavior、query semantics、migration 或 acceptance boundary 的決策已在 proposal 與 specs 中定案。
