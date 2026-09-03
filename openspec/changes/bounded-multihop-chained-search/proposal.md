## Why

Burni 目前將第二個點視為 recursive chain 並硬拒絕（`Recursive chain is not supported`，`MAX_RELATION_DEPTH = 1`）。OpenSpec `fhirpath-mongo-query` 仍寫「第一階段一層／阻擋 recursive chain」。這個用詞是錯的：FHIR R4 chained search 是 client 指定的 dotted path，不是沿 resource graph 走直到 cycle 或 budget 停下。

第一階段凍結時已預留 relation depth／cost 欄位，但 depth 硬編碼為 1、cost 與 `MAX_QUERY_COST`（10）共用、same-key cycle check 會拒絕合法階層（例如 `partof.partof`）。若把官方 145 型 `target` 當成封閉 fan-out 直接延伸，成本會爆炸。產品決策已定（ADR 0008 accepted）；規格必須先改，runtime 才能動。

## What Changes

- 支援 bounded multi-hop chained search，使 `Observation?subject.organization.name=` 與 `Organization?partof.partof.name=` 可執行。
- Relation depth 等於參數名稱中的點數；`MAX_RELATION_DEPTH = 3`。
- 不設 relation cycle limit。同一個 lookup key MAY 重複（`partof.partof` 合法）。刪除目前的 same-key cycle reject。
- Fan-out：沒有 type filter 的 hop 只繼續宣告的 reference target types 中、對下一個 code 有 effective Registry lookup 的型別。零匹配 = unknown，不是 empty hit-set。每個 reference target type 使用自己的 compiled plan；目前 last-plan-wins 是缺陷。
- Open reference target（declared targets 空、含 `Resource`、或列舉 FHIR resource catalog）該 hop REQUIRES type filter（例如 `:Patient`），並在套用 cost 之前拒絕。Contained `Resource` extraction paths 維持不可 chain；它們不是 collections，也不是 open reference targets。
- Chain allowlist：empty／absent SearchParameter.chain = 允許任何 effective next-hop lookup；non-empty = 限制 codes。Runtime 行為維持不變；修正規格目前把 chain field 當 required 的錯誤（官方 R4 bundle 的 chain 全是空的）。
- Relation cost 以每條 chained search PATH 計算，不與 `MAX_QUERY_COST`（10）共用。每個 hop 加總固定 lookup overhead 與各可執行 target plan 的 `estimatedCost`，再乘該 hop 的 fan-out width。`MAX_RELATION_COST = 24`。接受 request 層多條 path 疊加的 residual。
- **BREAKING** error contract：unknown hop／undeclared type／disabled 維持 `Unknown search parameter`。Open reference target 缺 type filter、depth > 3、cost > 24 回傳 400 OperationOutcome，且 MUST 標明 limit class；不得洩漏內部 reason string（例如 `Relation cost exceeds allowed limit`）。
- 範圍：normal search、Bundle GET validation、conditional delete。不含 `_include`／`_revinclude`／`_has`。
- 詞彙以 CONTEXT.md 為準（Chained search、Chain allowlist、Reference target type、Type filter、Open reference target、Relation hop／depth／cost）；ADR 0008 為 accepted。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `fhirpath-mongo-query`: 將「Reference chain SHALL be controlled and bounded」從第一階段一層／阻擋 recursive chain，改為 bounded multi-hop（depth 3、path-level cost 24、open reference target MUST 有 type filter、無 cycle limit）。同步修正「Controlled reference operations SHALL preserve correlated and bounded semantics」中 one-level chain 與「recursive chain 一律 unknown／invalid」的措辭，使 chain allowlist、fan-out 與 **BREAKING** error contract 與上述產品決策一致。

## Impact

- 主要影響 `models/FHIR/searchParameter/executor/relationPlan.js`、`runtime/parameterName.js`（type filter 目前只作用於 first hop head）、`runtime/registrySearchHandler.js`、`runtime/bundleSearchValidation.js`、`api/FHIRApiService/search/searchParameterCreator.js`、`searchProcessor.js` 與 `condition-delete.js`。
- 測試以 `test/searchParameter/executor/relation-plan.test.js` 為主；OpenSpec 契約在 `openspec/specs/fhirpath-mongo-query/spec.md`。產品決策見 `docs/adr/0008-bounded-multihop-chained-search.md`。
- 既有一層 chain 的成功路徑應維持可執行；超過一層且符合 depth／cost／type filter 的合法路徑由拒絕改為執行。Exceeding depth／cost 與 open reference target 缺 type filter 的錯誤由 unknown 改為具名 limit class，屬 **BREAKING**。
- `_include`、`_revinclude`、`_has` 不在本 change 範圍。
