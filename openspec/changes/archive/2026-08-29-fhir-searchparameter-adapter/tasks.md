## 1. Source 與 registry foundation

- [x] 1.1 將 FHIR R4 官方 SearchParameter Bundle 移至版本控制的 source/fixture 位置，保存 `4.0.1`、原始 `status` 與 provenance；確認 `temp/search-parameters.json` 不再是長期 source
- [x] 1.2 建立 SearchParameter source adapter，統一解析官方 Bundle entry 與 `models/mongodb/model/SearchParameter.js` 查詢結果
- [x] 1.3 建立 FHIR R4 SearchParameter resource validation、canonical `url/version` identity 與 `(base, code)` lookup key normalization
- [x] 1.4 建立 provenance-aware activation overlay：只提升受信任官方 Bundle 中可編譯的 draft，DB draft/unknown/retired 預設停用，且不修改 raw resource
- [x] 1.5 建立 source merge 與 conflict diagnostics；相同 canonical `url/version` 允許 DB overlay，不同 active definition 共用 `(base, code)` 時整組停用
- [x] 1.6 建立 immutable registry snapshot、disabled/conflict index 與 atomic reload lifecycle，接上啟動、SearchParameter CRUD 成功後及明確管理 reload

## 2. FHIRPath parser 與 compiler

- [x] 2.1 評估可產生 AST 的 FHIRPath parser dependency 或受限內部 parser，實作 parser adapter interface，不讓 parser implementation 滲入 runtime executor
- [x] 2.2 建立 restricted FHIRPath AST validator，支援 property navigation、collection flatten、union、choice `as` syntax 與 existence；`ofType` 與非 allowlisted literal `where` comparison 維持 unsupported
- [x] 2.3 實作 bounded `where(resolve() is Type)` reference target guard；拒絕 target dereference、versioned/contained/logical identifier reference、terminology、arithmetic、未允許函數與任意 path/operator，並為每個拒絕案例產生可追蹤 diagnostics
- [x] 2.4 建立 SearchParameter type/operator capability matrix，支援 number、date、string、token、reference、quantity、uri，辨識並停用 composite/special
- [x] 2.5 建立 `SearchQueryPlan` IR，表達 typed extraction/predicate、reference target guard、choice selection、FHIR type semantics、multipleOr/multipleAnd、normal/relation query、depth、cost、required index metadata 與 diagnostics
- [x] 2.6 將既有 `queryBuild.js` 與 `searchParameterQueryHandler.js` 的可重用邏輯收斂為 type-specific executor primitives，補齊或修正 compiler 需要的 R4 comparator/modifier 行為

## 3. Mongo executor 與 chain

- [x] 3.1 實作 SearchQueryPlan 到 Mongo filter 的 allowlisted executor，限制 field path、operator、regex 與 query cost，禁止 expression eval、任意 JavaScript 與 `$where`
- [x] 3.2 實作 FHIR string、token、number、date、reference、quantity、uri 的 query value parsing，以及 multipleOr/multipleAnd、modifier、comparator validation
- [x] 3.3 將 `_id`、`_lastUpdated` 接到 registry contract，並維持 `_include`、`_revinclude`、`_sort`、分頁與 summary 的獨立 control-parameter pipeline
- [x] 3.4 建立 relation plan 與一層 controlled reference chain executor，只依 `chain`、`target` 與 registry lookup index 產生 aggregation
- [x] 3.5 在 relation plan 中加入 depth、cycle guard、estimated cost 與 max-cost contract；phase one 對 recursive chain 明確拒絕

## 4. Runtime migration

- [x] 4.1 修改 `searchParameterCreator.js` 以 snapshot lookup 為主要路徑，依序處理 effective definition、disabled/conflict unknown error 與完全未知 code 的 legacy fallback
- [x] 4.2 將 registry reload 整合至 SearchParameter CRUD lifecycle，確保 reload failure 不會替換目前可用 snapshot
- [x] 4.3 調整 `api_generator/API_Generator_V2.js` 與 `api_generator/parameterHandler.js`，停止把 `FHIRParametersClean.json` 當成新的 SearchParameter source，並保留 generated handler 相容產生
- [x] 4.4 加入 registry 與 generated handler 的 shadow comparison/diagnostics，不讓 legacy output 覆寫 registry query plan 或啟用已停用 definition
- [x] 4.5 加入 runtime feature flag 與逐 resource/type 啟用設定，完成 registry-first 遷移並保留切回 legacy handler 的 rollback 路徑

## 5. 驗證與遷移完成條件

- [x] 5.1 建立 source merge、activation overlay、identity/conflict、diagnostics 與 immutable snapshot atomicity tests
- [x] 5.2 建立 expression fixture tests，覆蓋 union、`resolve() is Type`、兩種 `as` syntax、choice、exists、unsupported `ofType`/非 allowlisted literal `where` 與不安全 input
- [x] 5.3 建立 type/operator/multiple value contract tests，驗證 R4 comparator、modifier、multipleOr/multipleAnd 與不支援組合的錯誤
- [x] 5.4 建立 SearchQueryPlan 到 Mongo filter/aggregation 的 golden tests，驗證 regex escaping、path allowlist、cost/depth guard 與 control parameter separation
- [x] 5.5 建立 Mongo integration tests，覆蓋 nested arrays、choice fields、reference target guard、one-level chain、query results 與 reload consistency
- [x] 5.6 建立 registry 與 legacy handler 對照測試，逐 resource 確認成功結果與 unknown parameter 行為相容
- [x] 5.7 記錄全量 R4 Bundle 的 compiler diagnostics，確認所有可編譯定義進入 effective registry，並確認 fallback 已無使用後再移除 `FHIRParametersClean.json` runtime source 與 generated handler generation
- [x] 5.8 建立 Patient service-level MongoMemoryServer integration test foundation：使用 opt-in helper 與 fake request/response，驗證 CreateService → ReadService → SearchService；涵蓋既有 13 個 effective Patient Registry code 的 positive/negative hit-set、f201 fixture 補充與 companion Patient；不包含 Organization、reference chain 或 production rollout

## 6. Search-type projection 與 per-lookup plan

- [x] 6.1 Compiler 為每個 `(resourceType, code)` 產生獨立 `SearchQueryPlan`，以 `extractionPaths`（path + datatype）取代未標型別的 `fieldPaths`；datatype 來自該 resource 的 `to-code-use-definition`；`as`/`ofType` 編成 Choice element name
- [x] 6.2 只保留該 lookup resource 的 union 分支；將 Incompatible branch（無 projection 的 datatype、quantity+SampledData、type map 找不到的 path、BackboneElement leaf）省略並留下 diagnostic；零可執行 path 才 disable 該 lookup
- [x] 6.3 Executor 依 `(search type, datatype)` 做既有 API field set 的 search-type projection，並 `$or` 所有可投影分支；不搜 datatype 根、不複製 quantity `$eq: null`
- [x] 6.4 建立 golden filter tests：Address/HumanName、token coding/value、reference `.reference` 與 target guard、choice casing、union 全分支、SampledData 省略、缺失 type map path
- [x] 6.5 建立 document fixture + Mongo find tests：Address、choice（`deceasedDateTime`）、reference array correlation、combo-code 巢狀陣列
- [x] 6.6 啟用門檻改為 6.4+6.5；shadow comparison 維持診斷，不要求與 legacy filter JSON 全等才可加入 `enabledResourceTypes`

## 7. `resolve()` 與 choice type completion

- [x] 7.1 擴充 parser/AST adapter，解析 `where(resolve() is Type)`、`(path as Type)` 與 `.as(Type)`，並拒絕 `ofType` 與非 allowlisted literal `where`
- [x] 7.2 建立 reference target guard lowering：支援 relative/absolute URL、bare ID normalization、`Reference.type` consistency 與 unsupported value validation
- [x] 7.3 建立 choice element name 與 Resource type map projection，保留 FHIR type、physical field 與 nested search leaf metadata
- [x] 7.4 實作 reference/choice union executor：所有可用 branches 以 OR 組合，multipleAnd 以 AND 組合，reference array 使用 correlated predicate
- [x] 7.5 將 registry lookup、disabled definition 與 invalid reference value 接回既有 API error flow，禁止 legacy fallback 掩蓋已知 disabled definition
- [x] 7.6 重新產生全量 R4 compiler diagnostics，確認 resolve/as 可支援定義進入 effective registry，unsupported definition 維持 disabled，並確認 fallback 使用狀況

## 8. Patient 23-code 完整遷移契約

- [x] 8.1 將 `active`、`address`、`address-city`、`address-country`、`address-postalcode`、`address-state`、`address-use`、`birthdate`、`death-date`、`deceased`、`email`、`family`、`gender`、`general-practitioner`、`given`、`identifier`、`language`、`link`、`name`、`organization`、`phone`、`phonetic`、`telecom` 全部編譯為 effective `(Patient, code)` lookup
- [x] 8.2 以通用遞迴 datatype/path resolver 支援 `address.*`、`name.family` 與 `name.given`，不得新增依 Patient code 命名的 compiler alias 或特例
- [x] 8.3 擴充 allowlisted predicate AST 與 SearchQueryPlan：支援 `deceased` 的 exists/choice/false semantics，以及 email/phone 的固定 `ContactPoint.system` predicate；對同一 ContactPoint 使用 correlated system/value filter
- [x] 8.4 建立 23 個 code 的 positive/negative document hit-set、companion 不命中、choice、nested array 與 projection 邊界測試；`deceased=true` 覆蓋 Boolean true/DateTime，`deceased=false` 只覆蓋明確 Boolean false
- [x] 8.5 對 23 個 code 驗證 SearchParameter 宣告與 type capability matrix 的 comparator、modifier、multipleOr、multipleAnd，並建立全部 23 個 code 的 `:missing=true/false` 測試；不支援組合 MUST 回傳標準 invalid search parameter/value error
- [x] 8.6 確認 Address.text 不納入本階段 projection、phonetic 維持相容性字串匹配，且不把本階段結果宣稱為完整 R4 Address.text 或 phonetic matching
- [x] 8.7 在所有 8.1–8.6 gate 通過後，將 `Patient` 加入 `enabledResourceTypes`，對 23 個已遷移 code 禁止 legacy fallback；未列出的 Patient custom/unknown code 保留 migration fallback 與 feature-flag rollback
