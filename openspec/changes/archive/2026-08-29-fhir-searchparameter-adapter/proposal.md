## Why

目前搜尋參數的 runtime 定義來自 `FHIRParametersClean.json` 與 generated handlers，而不是 FHIR R4 `SearchParameter` resource；這造成 expression、status、modifier、comparator、multipleOr/multipleAnd 等語意遺失，也讓資料庫中的 SearchParameter 無法成為有效搜尋定義。R4 fixture 中大量合法定義使用 `where(resolve() is Type)` 與 choice `.as(Type)`，目前 compiler 會停用這些定義。現在需要建立以 FHIR resource 為契約的 registry 與受限 FHIRPath compiler，讓搜尋語意可驗證、可診斷，並逐步取代現有字串清理與手工 mapping。

## What Changes

- 以 FHIR R4/4.0.1 `SearchParameter` resource 作為唯一定義模型，合併官方 Bundle 與資料庫 registry。
- 保留官方 resource 原始 status 與 provenance，透過 activation overlay 將受信任官方 R4 Bundle 中可編譯的定義視為 effective active；資料庫 draft 預設不啟用。
- 建立 immutable、可 atomic reload 的 SearchParameter registry snapshot，並以 canonical `url/version` 識別定義；不同定義衝突時拒絕該衝突。
- 建立 restricted FHIRPath AST compiler，只允許明確 allowlist 的 path、collection、union、bounded `where(resolve() is Type)`、choice `as`、choice type、existence 與固定欄位 predicate。
- 支援 `resolve() is Type` 的 bounded reference target type guard；支援相對與 absolute URL，不執行目標資源 dereference。
- 支援 `(path as Type)` 與 `.as(Type)` 的 choice type projection；union branch 依明確 search-type projection 執行。
- versioned、contained、logical identifier reference，以及 `ofType(Type)`、非 allowlisted 的 literal `where` predicate 與 reference chain 擴充維持不支援。
- 不支援的語法或語意使整個 definition disabled；已知 datatype 但沒有 projection 的 branch 依既有 projection policy 省略並記錄 diagnostics。
- 以 `SearchQueryPlan` IR 連接 expression、FHIR search value semantics 與 Mongo filter/aggregation，保留一層 controlled chain 與未來 recursive chain 的擴充點。每個 `(resourceType, code)` lookup 有獨立 plan 與 typed `extractionPaths`（path + FHIR datatype），不得讓多個 `base` 共用一份未篩選 plan。
- Compiler 以 Resource type map（`to-code-use-definition`）標 datatype；`as` 編成 Choice element name。Executor 依 `(search type, datatype)` 做 search-type projection，field set 對齊既有有效 API，不搜 expression 的 datatype 根、不複製 `parameterHandler` 字串切割、不複製 legacy quantity `$eq: null`。
- 不相容的 `(search type, datatype)` 分支（含 quantity 遇上 SampledData、type map 找不到的 path）從該 lookup 省略並留下 diagnostic；零可執行 path 才停用該 lookup。
- 第一階段支援 `number`、`date`、`string`、`token`、`reference`、`quantity`、`uri`；`composite`、`special` 與不可編譯定義停用並留下 diagnostics。不做 CodeableConcept token `.text`、Period overlap、Address `.text`、SampledData quantity bounds。
- 依 R4 capability matrix 執行 `multipleOr`、`multipleAnd`、modifier 與 comparator；不支援的組合不得靜默降級。
- 讓 registry 成為主要 runtime 路徑；現有 generated handlers 暫作 fallback 與 shadow comparison。Shadow 是診斷，不是 `enabledResourceTypes` 的唯一門檻；啟用依 golden filter 與文件 fixture。
- 將 `_id`、`_lastUpdated` 納入 registry compiler，但維持 `_include`、`_revinclude`、`_sort`、分頁及 summary 等 control parameters 的獨立 pipeline。
- 增加 resource validation、compiler contract、expression fixture、query-plan golden tests、Mongo document fixtures 與舊 handler 對照測試。

## Capabilities

### New Capabilities

- `fhir-searchparameter-registry`: 載入、啟用、驗證、衝突處理、snapshot reload 與 diagnostics。
- `fhirpath-mongo-query`: 將受限 FHIRPath SearchParameter expression 編譯為 SearchQueryPlan，並執行 FHIR search 語意與 Mongo query。

### Modified Capabilities

無。

## Impact

- 主要影響 `api_generator/parameterHandler.js`、`API_Generator_V2.js`、`FHIRParametersClean.json`、generated parameter handlers，以及 `searchParameterCreator.js`、`searchParameterQueryHandler.js`、`queryBuild.js`、`to-code-use-definition`（Resource type map）與 chain/search processor。
- 會使用現有的 FHIR `SearchParameter` Mongoose model，並新增 registry/compiler/query-plan、reference/choice projection 與測試。
- 既有搜尋 API 的成功結果與 unknown parameter 行為需維持相容；停用的 SearchParameter 不對外暴露，查詢時走既有 unknown search parameter 錯誤流程。對不支援的 reference query value 回傳標準 invalid search parameter/value error。Search-type projection 的取捨見 `docs/adr/0002-searchqueryplan-per-lookup.md` 與 `docs/adr/0003-search-type-projection-existing-api.md`。
