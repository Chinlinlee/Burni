## Context

既有 `mongodb-schema-index-provisioning` change 已建立 collection、baseline index 與
temporal derived-index 的 provisioning boundary；其 design 明確將 token、reference、
string、number、quantity 與 uri 排除在第一階段之外。本 follow-up 只新增非 temporal
SearchParameter policy，並重用既有 desired manifest、reconcile、verify、lock/state
與 operational command。

Registry/compiler 已能提供 extraction path、datatype、choice branch、array path、
reference target 與 predicates，但 executable query plan 不等於可安全建立 MongoDB
index。尤其是同 element correlation、B-tree 可支援的 modifier、raw storage semantics
與 number/quantity capability matrix 必須先被明確化。

## Goals / Non-Goals

**Goals:**

- 為六種非 temporal search type 建立可測試的 lookup/projection-level index policy。
- 讓安全的 non-temporal entries 與 temporal entries 共用 desired manifest 與 reconcile。
- 以既有 nested FHIR storage 支援 deterministic、non-unique、additive-only indexes。
- 維持 query hit-set、raw value semantics、custom SearchParameter execution 與既有
  application readiness contract。
- 讓 policy rejection、manifest identity drift 與 unsafe array shape 具有穩定 diagnostics。

**Non-Goals:**

- 不新增 shadow/materialized search fields、write-time dual maintenance 或 backfill。
- 不處理 composite SearchParameter、custom SearchParameter derived index 或新 URI/
  UCUM/reference canonicalization。
- 不實作 `sa`、`eb`、`ap` 的 number/quantity runtime semantics。
- 不使用 query `$hint`，不自動刪除 extra index，不把效能 index 變成 unique constraint。
- 不改變既有 temporal index generator、temporal storage 或 FHIR API response contract。

## Decisions

### 1. 以 follow-up capability 延伸既有 provisioning

新增 `mongodb-searchparameter-derived-indexes` capability，不修改已完成 change 的
歷史文件。新的 adapter 將非 temporal entries 交給既有 desired manifest generator；
provision、verify、lock/state 與 readiness 行為維持單一 pipeline。

這比在原 change 中回填 non-goal 更容易保持歷史可追蹤性，也比建立第二套 MongoDB
provisioning pipeline 避免 collection/index reconcile、manifest checksum 與 failure
semantics 分裂。

### 2. Policy 與 FHIR source 分離

不在 FHIR SearchParameter source resource 新增 `indexable` 欄位。新增獨立 policy
adapter，輸入 per-lookup compiled plan 與 extraction metadata，輸出：

- approved 或 rejected outcome；
- 一個或多個 extraction/projection branch；
- key pattern、options 與 policy version；
- array correlation metadata；
- stable diagnostic 與 provenance。

這可避免把 MongoDB physical capability 混入 FHIR definition semantics，也讓
database overlay 可以繼續執行而不會因缺少 deployment policy 而誤產生 index。

### 3. 直接索引現有 nested FHIR fields

Derived indexes 直接使用既有 resource document fields。`token` 使用 system/code 或
system/value correlation；`reference` 使用 stored `reference`；`string` 使用 exact
projected leaf；`number` 使用現有 numeric field；`quantity` 使用 value 與可選的
system/code；`uri` 使用 raw URI。

不新增 shadow field 是因為這六種型別目前沒有已驗證的 materialized storage contract。
若為了 prefix、contains、URI normalization 或 UCUM conversion 引入 shadow field，
就必須同時設計 write path、legacy data migration、read serialization 與 rollback，
超出本 change 的 index provisioning scope。

### 4. 以 projection signature 建立 identity 與 key patterns

Logical identity 使用 resource type、extraction branch、datatype/search type、
projected field set、key pattern、options 與 policy version。SearchParameter code、
canonical URL 與 source artifact identity 只作 provenance。

各型別 policy 的 key patterns 為：

- token：CodeableConcept/Coding 的 system-code compound 與 code-only；Identifier/
  ContactPoint 的 system-value compound 與 value-only。
- reference：`reference` single-field；target guard 仍由 runtime filter 負責。
- string：每個 exact projected leaf 一個 single-field index；Address/HumanName
  不合併跨 leaf `$or` 為 compound index。
- number：numeric path single-field index。
- quantity：value single-field 與 system-code-value compound index。
- uri：raw URI single-field index，exact/above/below 共用。

完全相同的 canonical key/options 先 deterministic deduplicate，再產生 physical name。
Physical name 使用 readable prefix 加 identity hash，以避免 SearchParameter code 重複
或 index name 超過 MongoDB 長度限制。

### 5. 將 array correlation 作為準入條件

Policy 重用 compiler 已產生的 array path/correlation metadata。只有單一可驗證 array
scope 能保證 predicates 套用在同一 element 時才允許 derived index。平行 array
ancestors、positional path、無法嵌入 correlation 的 branch 都產生 rejection diagnostic。

Choice/union branch 不合併為一個模糊 identity；每個 branch 獨立驗證、獨立命名與
獨立 reconcile。某個 branch unsafe 不得污染其他安全 branch，但也不得被靜默忽略。

### 6. Capability matrix 必須反映 executable runtime

移除 number/quantity capability matrix 中 runtime 尚未支援的 `sa`、`eb`、`ap`。本
change 不新增這些 comparator 的 semantics；policy 與 tests 必須防止未來只修改
capability declaration 就錯誤宣稱支援 derived index。

String default prefix 與 `contains` 維持現有 case-insensitive regex semantics，但在沒有
shadow/collation contract 前不列為 indexed capability。URI 保留 raw scheme、authority、
path 與 hierarchy matcher 現有語意，不新增 canonicalization。

### 7. 合併至單一 manifest 與 additive reconcile

Non-temporal entries 使用既有 manifest envelope，保存 `source: "search-parameter"`、
policy version、完整 identity、provenance 與 deterministic physical name。manifest
checksum 同時涵蓋 ordering、identity、key pattern、options 與 policy/source identity。

Derived index options 固定 non-unique、無新增 collation、partial filter 或 sparse
constraint。Missing index 可由 `provision` 建立；compatible index 視為完成；extra、
option mismatch 或 identity drift 只由 `verify` 報告。Runtime 不使用 `$hint`，讓
physical index rename 不成為 public query contract。

### 8. 保留效能與正確性的邊界

Derived index 缺失時，query 仍依既有 plan 執行並可退回 COLLSCAN；application readiness
不因一般效能 index 缺失而失敗。這延續既有 temporal provisioning 對 correctness 與
performance 的分離，避免把部署 drift 變成不必要的 API outage。

## Risks / Trade-offs

- [Risk] 六種型別的 projection branch 可能造成 resource collection 上 index 數量增加。
  → [Mitigation] 以完整 canonical key/options deterministic dedup，並把 manifest
  artifact 與 provisioning phase timing 納入 verify。
- [Risk] 直接 nested multikey index 仍可能因 MongoDB planner 選擇而未充分改善效能。
  → [Mitigation] policy 只保證 semantic safety 與可用的 index shape，不保證每次 query
  都使用 index；以 diagnostics/`explain` 驗證作為後續 operational work。
- [Risk] capability matrix 曾宣告 runtime 不支援的 comparator。
  → [Mitigation] 同一 change 移除錯誤宣告，並以 number/quantity regression tests 鎖定。
- [Risk] raw URI、reference 與 string semantics 限制了可索引的 modifier 範圍。
  → [Mitigation] 不用 misleading index 宣稱覆蓋 unsupported mode；未來 normalization
  或 shadow storage 另開 change。
- [Risk] manifest policy version 與 compiled artifact identity drift。
  → [Mitigation] manifest 保存 source/policy identity，CI 與 verify 對 checksum/drift
  fail fast。

## Migration Plan

1. 建立 non-temporal policy contract、manifest entry schema、diagnostics 與
   deterministic naming rules。
2. 以純 unit tests 驗證六種型別的 key patterns、unsupported modifiers、raw semantics
   與 array correlation。
3. 將 policy adapter 接到既有 desired manifest generator，更新可提交的 JSON artifact
   與 checksum gate。
4. 接入既有 provision/verify reconcile；先在測試 MongoDB 驗證 resource collections
   的 `listIndexes` 與 missing/extra/mismatch 行為。
5. 保持 custom SearchParameter 與缺少 derived index 時的既有 runtime 行為；部署可先
   執行 verify，再以 provision additive 建立 indexes。
6. Rollback 時停止新 policy source 或回復同一版本 manifest；不刪除已建立 indexes，
   後續 verify 只回報 extra/drift，application 仍可服務。
