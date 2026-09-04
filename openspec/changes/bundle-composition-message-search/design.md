## Context

See `proposal.md` - Why.

Canonical FHIR R4 定義將 `Bundle.composition` 與 `Bundle.message` 編譯為 reference SearchParameter，但兩者的 expression 都是 `Bundle.entry[0].resource`，其 target 分別為 `Composition` 與 `MessageHeader`。這些 resource 是 Bundle 文件中的 embedded object，不是應由 relation `$lookup` 讀取的獨立 collection。

目前一般 relation composer 已支援最多三層 client-specified dotted path、closed/open reference target、per-type plan 與 path cost，但會跳過 datatype `Resource` extraction path。這個行為對 contained resource 仍正確，對兩個官方 Bundle special entry point 則不正確。

## Goals / Non-Goals

**Goals:**

- 以固定的 `entry[0].resource` inline target 支援 `composition` 與 `message` 的 direct identity search。
- 讓 inline target 可接到現有 bounded chained-search path，並讓後續 Reference hop 仍遵守 target、type filter、depth、cost 與 typed plan 規則。
- 在同一個 embedded resource 上套用 Composition 或 MessageHeader 的 Registry-derived plan，不複製舊 field mapping。
- 保留 `_include`、`_revinclude`、`_has` 的既有行為與一般 contained Resource 的不可 chain 語意。

**Non-Goals:**

- 不將 Composition 或 MessageHeader 從 Bundle 拆成獨立資料保存。
- 不使用 `$graphLookup`、application-side N+1 或任意 `entry` fan-out。
- 不把所有 datatype `Resource` extraction path 開放為 chained target。
- 不改寫 compiler `SearchQueryPlan.depth` 的官方 `SearchParameter.chain` 語意。
- 不將 conditional delete 的 chained search改為 aggregation delete。

## Decisions

### 1. 以 inline relation metadata 區分兩個官方 Bundle entry point

`Bundle::composition` 與 `Bundle::message` 的 relation metadata SHALL 額外記錄：

- 固定 source path：`entry.0.resource`
- 固定 target type：`Composition` 或 `MessageHeader`
- Bundle type predicate：`document` 或 `message`
- embedded target 模式，而非 collection lookup 模式

這能保留 compiler 對 canonical expression 的一般處理，同時只為官方 special entry point 開例外。若直接將所有 `Resource` datatype 當成可 chain，contained resource 會被錯誤當成 collection；若把 Bundle special search 寫成 code-specific field mapping，則會繞過 Registry plan 與 target SearchParameter 語意。

### 2. Direct identity search 使用 embedded identity 與 entry fullUrl

直接查詢 `composition` 或 `message` 時，先依固定 target type 與 Bundle type 做 gating，再以 reference value 建立 identity predicate：

- relative `Composition/id` 或 `MessageHeader/id` 比對 embedded resource 的 `resourceType` 與 `id`
- bare id 依固定 target type 正規化
- absolute URL 比對 `entry[0].fullUrl`，並保留可由 URL path 解析的 resource type
- versioned、contained 與 logical identifier value 維持既有 reference validation

這比只比對 `resource.id` 更完整，因為 Bundle entry 的 identity 位於 `fullUrl`，而 embedded resource 自身仍可能只有 logical `id` 可用。

### 3. Chained inline path 先進入 target plan，再決定是否需要 `$lookup`

參數名稱解析後，第一個 hop 若為 `composition` 或 `message`，composer 將其視為固定 inline branch：

- `composition.patient` 直接在 `entry.0.resource` 的 Composition context 套用 `Composition::patient`
- `message.focus:Patient.name` 先在 `entry.0.resource` 的 MessageHeader context 讀取 `MessageHeader::focus`，再對 Patient collection 建立下一層 `$lookup`
- 每個後續 hop 仍依 target resource type 取得自己的 effective plan
- inline context 的 extraction path 與 predicates 以 `entry.0.resource` prefix 套用，不能展開整個 `entry` array

內嵌 target 不建立 `$lookup`；只有由 embedded target 的 Reference extraction path 指向外部 resource 時才建立 `$lookup`。Terminal typed filter 必須使用實際 target branch 的 plan，避免 closed fan-out 的 last-plan-wins。

### 4. Bundle gating 是 relation 的必要條件

Aggregation 與 direct filter 都必須同時加入：

- `composition`：`type = document` 與 `entry.0.resource.resourceType = Composition`
- `message`：`type = message` 與 `entry.0.resource.resourceType = MessageHeader`

若 stored Bundle 不符合條件，查詢只是不命中。`entry[1]` 或其他 entry 不參與 special relation。這避免資料雖不符合 FHIR Bundle invariant，卻因任意 embedded resource 而被錯誤命中。

### 5. Target type 與 open-target 規則沿用 Registry

`Composition::patient` 使用其 canonical effective plan 的 `Patient|Group` target fan-out；`MessageHeader::focus` 使用其近乎完整 catalog target 的 open-target 規則：

- `composition.patient.name` 可對 Patient 與 Group 各自建立 branch
- `message.focus.name` 在沒有 type filter 時回 `missing-type-filter`
- `message.focus:Patient.name` 只建立 Patient branch
- 未宣告或 disabled 的 target lookup 維持 unknown

不可從 parameter name、legacy `currentSupportParameters.json` 或舊文件 field mapping 推導 target。

### 6. Inline hop 仍計入 relation depth 與 cost

Relation depth 依 dotted parameter name 的點數計算，因此 `composition.patient.name` 的 depth 為 2。Inline hop 的 branch width 固定為 1，仍加入與一個 relation hop 相同的固定 overhead 與 target plan `estimatedCost`；後續外部 Reference branch 依實際 fan-out 各自加成本。`MAX_RELATION_DEPTH = 3`、`MAX_RELATION_COST = 24` 與 source plan 不計入 relation cost 的規則維持不變。

這會對 inline path 使用保守但一致的成本估計，避免「沒有 `$lookup` 就不受 relation budget 控制」形成繞過。

### 7. 三入口共用 special relation composer

Normal search、Bundle GET validation 與 conditional delete 先使用相同的 direct/chained special relation validation：

- unknown、invalid reference value、disabled lookup 維持既有分類
- `missing-type-filter`、`relation-depth`、`relation-cost` 使用具名 400 limit error
- conditional delete 對合法 chained path 仍在 validation 後回既有 chained-search unsupported 訊息
- direct `composition`／`message` query 可使用與 normal search 相同的 embedded identity filter

這避免某一入口把 inline special search 視為普通 `Resource` field，或把 relation limit 吞成 unknown。

### 8. 不採用 custom Bundle aliases

不新增 `composition-title`、`message-focus` 等 Bundle-specific SearchParameter aliases。FHIR target resource 的有效 SearchParameter code 直接沿用，例如 `composition.patient`、`message.focus:Patient.name`。這保持 client-facing syntax 與 canonical Registry source 一致，也避免為 Composition/MessageHeader 的每一個欄位建立重複契約。

## Risks / Trade-offs

- [Embedded path projection] 目前 typed filter 多以 resource-root path 建立 → 以受控 path prefix 與 correlation-aware transformation 套用到 `entry.0.resource`，並用 direct embedded fixtures 驗證。
- [Invalid stored Bundles] 不符合 Bundle invariant 的資料可能被靜默排除 → 將其定義為不命中，並以 `entry[1]` positive / `entry[0]` negative fixture 防止錯誤 fan-out。
- [MessageHeader.focus fan-out] open target 若缺 type filter 會改變既有 unknown 行為 → 在 composer fan-out 前回傳穩定 `missing-type-filter`，並在三個入口測試相同 class token。
- [Cost conservatism] inline hop 沒有實際 collection lookup 仍計固定成本 → 保持每個 client-specified relation hop 的一致 budget，換取不繞過安全上限。
- [Legacy documentation] 舊文件可能示範所有 `entry` 的 field path → 同步更新文件與測試，並確認 Registry path 是唯一執行來源。

## Migration Plan

1. 更新 `fhirpath-mongo-query` delta spec 與本 change tasks，明確記錄 Bundle inline special exception。
2. 擴充 relation metadata/composer，使 `composition`、`message` 能辨識固定 inline target，並保留一般 contained `Resource` skip。
3. 將 direct identity filter 與 Bundle type/first-entry gating 接到 normal search、Bundle GET validation、conditional delete。
4. 將 inline context 接到 nested relation aggregation，覆蓋 Composition/MessageHeader target plan、外部 Reference hop 與 open type filter。
5. 新增 document/message fixtures、正負向 hit-set、multi-value、limit class 與三入口 tests。
6. 更新 Bundle 搜尋文件，移除所有-entry legacy field mapping。
7. 以 focused tests 驗證後再執行完整 fast/full profile。Rollback 為 revert 本 change 的 planning/runtime/test/documentation commits；不需要資料遷移。
