## 1. 解析 hop 與 type filter

- [x] 1.1 擴充 `models/FHIR/searchParameter/runtime/parameterName.js` 的 `parseSearchParameterName`：以 `.` 切開後，最後一段是 terminal filter（`:` 為 modifier），其餘每一段是 hop（`:` 為 type filter）；沒有點時 `:` 仍為 modifier。
- [x] 1.2 讓 parse 回傳 hop list（每 hop 含 code 與可選 type filter）與 terminal（code／modifier），並保留既有 head 的 `code`／`typeFilter`／`chain` 給非 chain 路徑；composer MUST 吃 hop list，不得只看 head 或把中間 `:Type` 當下一 hop 的 code。
- [x] 1.3 為 parse 補可獨立驗證的測試（新檔或擴充既有 `parameterName`／`relation-plan` 測試）：覆蓋 `subject:Patient.organization:Organization.name:exact`、無點時 `name:exact` 仍為 modifier、以及中間 hop type filter 不再整段留在 `chain` 字串。

## 2. Open-target 偵測與 hop composer

- [x] 2.1 在 fan-out 與 cost 之前實作 open reference target 判定：declared targets 為空、含 token `Resource`、或列舉 `models/FHIR/fhir.resourceList.json` catalog。不得寫死 145，不得用「超過 9 型」當天花板；官方 145 型列表對 catalog（目前 146）的差一 MUST 仍判為 open。
- [x] 2.2 改寫 `models/FHIR/searchParameter/executor/relationPlan.js` 的 `buildRelationPlan`：依 hop list 組成 path（hop 陣列長度等於參數名稱點數），每個 hop 保留 source plan、可選 type filter、以及 executable branches `(targetResourceType, SearchQueryPlan)`；刪除單一 `targetPlan` 的 last-plan-wins（含 `targetLookupKey` 卻用 `matchedTargets[0]` 的現況）。
- [x] 2.3 Open hop 缺 type filter 時，在算 cost 之前拒絕並標 `missing-type-filter`。有 type filter 時以該字串為 collection，不得把空 targets 或 145 型列表展開成 catalog；含 `Resource` 的 hop 同樣以 type filter 命名 collection。145 型列舉上不在列出集合的 type filter 走 unknown。刪除 `declaredTargets.length === 0` → `Missing reference target type`。`isDeclaredTarget` 對空 targets 回 true 的行為保留，且不改 `_include`／`_revinclude` 所用判定。
- [x] 2.4 無 type filter 的封閉 hop 只繼續宣告 targets 中對下一 code 有 effective Registry lookup 的型別；零匹配回 unknown，MUST NOT 當 empty hit-set。empty／absent chain allowlist 允許任何 effective next-hop；non-empty 只允許列出的 codes。未知 hop、未宣告 type、disabled、非 reference 卻 chain、缺 terminal、allowlist 未列出 → unknown，不另開 limit class。
- [x] 2.5 刪除 `sourceLookupKey === targetLookupKey` cycle check（`partof.partof` 合法）與 `Recursive chain is not supported`。`MAX_RELATION_DEPTH = 3`，depth 等於參數名稱點數；點數 > 3 回 `relation-depth`，不必再算 cost。不得改寫 compiler `SearchQueryPlan.depth`；depth／cost 維持模組常數，不得做成 env-configurable。
- [x] 2.6 `MAX_RELATION_COST = 24`，只約束一條 path，MUST NOT 與 `MAX_QUERY_COST`（10）共用。每個 hop 對每個 executable branch 加 `(3 + targetPlan.estimatedCost)`；不得把 source plan `estimatedCost` 加進 relation cost。cost > 24 回 `relation-cost`。既有合法一 hop（`subject.name`、`subject:Patient.name`）MUST 仍可執行，不得被新公式打成 `relation-cost`。不設 request 層 cap。
- [x] 2.7 Composer 回傳結構化結果，至少區分 `valid`、unknown 類、以及 limit class（`missing-type-filter`／`relation-depth`／`relation-cost`）；不得只回 reason 字串讓入口猜測。內部字串（`Recursive chain is not supported`、`Relation cost exceeds allowed limit`、`Relation cycle is not allowed`）MUST NOT 進入 client diagnostics。

## 3. 巢狀 aggregation 與 per-type typed filter

- [ ] 3.1 將 `buildRelationAggregation` 改為對 hop list 遞迴組巢狀 `$lookup`：內層 hop 的 `$lookup` 放進外層 `$lookup.pipeline`；深度硬上限 3。對每個 source extraction path 與每個 hop branch 產出 `$unwind`、correlation `$match`、然後 `$lookup`。limit 失敗改由 composer 判定，本函式不得再 throw 內部 reason 字串。
- [ ] 3.2 Contained datatype `Resource` 的 extraction path 仍跳過，不得進入 `$lookup`；它們不是 collections，也不是 open reference targets。最內層才套 terminal `createTypedFilterPlan`，且 MUST 用該 branch 自己的 plan，禁止再拿單一 `relationPlan.targetPlan` 套到所有 collection。
- [ ] 3.3 改 `models/FHIR/searchParameter/runtime/registrySearchHandler.js`：吃組成後的 path（hop list／branches），不得只讀單一 `targetPlan` 再 `createTypedFilterPlan`。`query.chain` 維持 array，每個 chained parameter 各是一棵 hop tree、一條 pipeline。

## 4. 三入口錯誤對應

- [ ] 4.1 為三個 limit class 建立 typed error，使 `api/FHIRApiService/search/searchParameterCreator.js` 不會把它們收進 `UnknownSearchParameterError`。停止 `tryApplyRegistryParameter` 對任何 `!relation.valid` 一律 `return "disabled"`；停止 creator catch-all 把內部 Error 收成 unknown。`api/FHIRApiService/services/search.service.js` MUST 把 limit class 映成 400 OperationOutcome 並標明 class token。
- [ ] 4.2 改 `models/FHIR/searchParameter/runtime/bundleSearchValidation.js`：`!relation.valid` 不再一律 `Unknown parameter`。limit class 回 400 OperationOutcome 並標明 class token；unknown hop 維持 Unknown search parameter。
- [ ] 4.3 確認 `api/FHIRApiService/condition-delete.js` 走同一套 SearchParameterCreator 驗證與具名錯誤，且其 catch-all MUST NOT 把 limit class 收成 unknown。合法 chain 之後既有 `isChain` 執行拒絕（`Chained search is not supported for conditional delete`）MUST 維持；本 change 不得改成 aggregation 刪除。
- [ ] 4.4 公開 diagnostics 可含參數名稱與 class token（例如讓 `Composition.subject.name` 看起來像缺 `subject:Patient`）；MUST NOT 洩漏內部 reason string。範圍僅 normal search、Bundle GET、conditional delete；不含 `_include`／`_revinclude`／`_has`。

## 5. Spec 情境測試

- [ ] 5.1 擴充 `test/searchParameter/executor/relation-plan.test.js`：一層 chain（`subject.name`、`subject:Patient.name`）仍可執行，depth 等於點數 1（不得把 depth 期望成 `MAX_RELATION_DEPTH` 常數）。刪除 last-plan-wins、same-key cycle、recursive chain 的舊期望。
- [ ] 5.2 覆蓋 `Observation?subject.organization.name=`、`Organization?partof.partof.name=`、中間 hop type filter（例如 `subject:Patient.organization.name`），以及封閉多 target 的 per-type plans（每個 branch 有自己的 plan／filter，不得只 assert HTTP 200）。
- [ ] 5.3 覆蓋 open hop 無 type filter → `missing-type-filter`（在算 cost 之前）、open hop 有 type filter 只 lookup 該型別、點數 4 → `relation-depth`、path cost > 24 → `relation-cost` 且不洩漏內部 reason。
- [ ] 5.4 覆蓋 empty／absent allowlist 允許 effective next hop、non-empty allowlist 未列出的 code 回 unknown、未知 hop／未宣告 type／disabled 回 unknown 且 MUST NOT 用具名 limit class。
- [ ] 5.5 在 `test/searchParameter/runtime/include-and-entry-points.test.js`（必要時加上 parameterName／`test/searchParameter/compiler/plan-metadata.test.js`）驗證 search、Bundle GET、conditional delete 三入口對三個 limit class 的錯誤對應一致；conditional delete 在驗證通過後仍拒絕執行既有 chained-search 訊息。既有 `_include`／`_revinclude` 行為不得被當成 chained search path 改寫；`SearchQueryPlan.depth` 維持 compiler 對官方 `chain` 欄位的語意。
- [ ] 5.6 以 focused Mocha 驗證上述檔案，例如 `mocha --no-config --require test/hook.js --timeout 300000 --exit test/searchParameter/executor/relation-plan.test.js`，必要時再跑 parameterName／plan-metadata／include-and-entry-points。不得新增 request 層 cost cap、env 設定、`SearchQueryPlan.depth` compiler 欄位重寫、或 conditional delete 的 aggregate 執行。
