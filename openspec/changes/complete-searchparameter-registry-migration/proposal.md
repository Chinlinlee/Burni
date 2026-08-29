## Why

目前 SearchParameter 的 runtime、chain、`_include`/`_revinclude`、conditional delete 與部分 Bundle GET 流程仍依賴 `FHIRParametersClean.json`、generated parameter handlers 與 legacy query methods。這些來源遺失 FHIR R4 SearchParameter 的 expression、status、target、modifier、comparator 與 multiplicity 語意，且會讓 compiler 已停用的定義透過 fallback 被重新啟用。

本 change 將完成從 legacy search 到 Registry、SearchQueryPlan 與受限 FHIRPath compiler 的遷移，讓 146 種 production resource 在通過可重現的 fixture 與 hit-set gates 後使用 Registry-first，並移除所有 SearchParameter legacy runtime/build 依賴。

## What Changes

- 以版本控制中的 FHIR R4/4.0.1 SearchParameter Bundle 作為唯一 canonical source；`temp/fhir-search-parameters.json` 僅作一次性 migration inventory。
- 建立每個 resource 的固定官方 example mapping，保留原始 example，並將必要的 derived/synthetic fixtures 歸檔至正式 `fixtures`。
- 建立可重現且提交版本控制的 migration manifest，記錄 source hash、lookup、compiled/unsupported 狀態、plan、fixture、augmentation 與 expected hit-set。
- 對 146 種 production resource 逐一建立 Registry、compiler、golden filter 與 Mongo document hit-set gates；沒有 SearchParameter 的 resource 通過結構性 gate。
- 對缺少官方 example 的 resource 建立最小合法 synthetic fixture；缺少欄位不得被誤判為 compiler failure。
- 修復可支援的 parser、type-map、projection 與 predicate 問題；`composite`、`special`、無 expression 與明確不支援語法維持 unsupported，且不得 fallback。
- 將 normal search、受控一層 reference chain、`_include`、`_revinclude`、conditional delete 與 Bundle GET parameter validation 改由 Registry metadata/plan 驅動。
- 保留 Bundle transaction、URL parsing、response、pagination、summary 與其他非 SearchParameter control pipeline。
- **BREAKING** 移除所有 SearchParameter legacy fallback；Registry 永久啟用，停用或 unsupported lookup 走既有 unknown/invalid search parameter error flow。
- **BREAKING** 停止 API generator 讀取 `FHIRParametersClean.json` 與產生 parameter handlers；保留 API generator 的其他 CRUD、history 與 validation 產生能力。
- **BREAKING** 移除 `parameterHandler.js`、generated `*ParametersHandler.js`、`searchParameterQueryHandler.js` 與已解耦的 legacy search methods。
- 將 SearchParameter 專用的 `fhir-param` 邏輯移除；Bundle 所需的 resource type/id URL helpers 保留於獨立 utility。
- 移除 `search-parameter:shadow` 與 `search-parameter:rollout-status`；保留 `search-parameter:diagnostics` 並納入 CI，檢查 unknown、conflict 與未分類 compiler failure。
- 以 compatibility-plus-corrections 作為搜尋結果標準，不要求與 legacy filter JSON 完全相等。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `fhir-searchparameter-registry`: Registry 成為所有 production resource 的唯一有效搜尋定義與 runtime path；移除 legacy fallback；加入全量 enablement、fixture/manifest gates、正式 diagnostics 與 legacy source removal contract。
- `fhirpath-mongo-query`: 擴充並固定全量 migration 所需的 typed SearchQueryPlan、search-type projection、reference chain、control-parameter separation、unsupported handling 與多值/操作子測試契約。

## Impact

- 影響 `api_generator`、所有 generated parameter handler、`api/FHIRApiService/search`、chain、include/revinclude、conditional delete、Bundle operations 與 SearchParameter runtime。
- 影響 SearchParameter source adapter、registry snapshot、compiler、executor、Resource type map、Mongo aggregation 與 API error flow。
- 新增或整理 `fixtures`、fixture mapping、derived/synthetic documents、migration manifest、diagnostics CI command 與完整 resource-level tests。
- 正式 R4 Bundle、SearchParameter DB overlay、canonical identity、activation policy 與 conflict policy 成為 production 搜尋行為的來源。
- 非 SearchParameter 的 Bundle transaction、URL/id parsing、response、pagination、summary 與 CRUD/history/validation generation 維持既有功能。
