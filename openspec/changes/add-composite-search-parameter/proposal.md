## Why

FHIR R4 composite SearchParameter 目前在 registry/compiler 中被視為 unsupported，因此官方 Bundle 的 46 個 composite 定義無法進入有效搜尋 snapshot。這使 `code-value-*`、`characteristic-value`、`relationship` 與 `context-type-*` 等需要保持欄位關聯的查詢無法使用，也可能迫使使用者以多個獨立參數表達會產生錯誤交叉匹配的條件。

本變更依 FHIR R4 `SearchParameter` composite 規則，讓 registry-first 搜尋能以單一 composite value 組合 component 條件，同時保留既有 compiler、snapshot、Mongo filter 與 diagnostics 的一致性。

## What Changes

- 啟用可由既有搜尋型別 executor 處理的 R4 composite SearchParameter。
- 依 component `definition` canonical 解析被引用的 SearchParameter，並驗證 component type、operator、expression 與 composite scope。
- 支援 R4 composite value 的 escape-aware `$` component 分隔、`,` 多組 Pair OR、重複 query parameter AND，以及 `\$`、`\,`、`\|`、`\\` escaping。
- 以同一 composite scope／同一陣列元素組合 component filters，避免不同陣列元素被交叉匹配。
- composite modifier、格式錯誤、component 數量錯誤及無法驗證的 component 查詢 SHALL 回既有 HTTP 400 invalid-search-value contract。
- component canonical 找不到、指向 `composite`/`special`、含 chain，或 expression 無法安全編譯時，整個 lookup SHALL disabled 並產生穩定 diagnostics。
- 更新 compiled builtin artifact 與 migration artifacts，使 composite lookup outcome、plan、fixture provenance 與 hit-set 可重現。
- 新增 compiler、parser、executor、registry artifact、integration 與 negative tests；更新 composite 搜尋文件。

## Capabilities

### New Capabilities

無。Composite 搜尋是既有 FHIR SearchParameter registry capability 的延伸。

### Modified Capabilities

- `fhir-searchparameter-registry`: 新增 composite definition 編譯、component resolution、R4 value parsing、correlated filter execution、multiplicity 與錯誤 contract。

## Impact

- Registry compiler、activation policy、per-lookup `SearchQueryPlan` 與 snapshot hydrate。
- Query value parser、Mongo filter executor，以及現有 type projection、temporal、token、quantity 與 reference query builders。
- Builtin compile artifact、migration lookup/manifest/resource enablement/hit-set artifacts。
- SearchParameter compiler、executor、registry、migration 與 integration 測試。
- SearchParameter 搜尋文件與 OpenSpec registry contract。
