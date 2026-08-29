## 1. Source inventory 與 provenance

- [x] 1.1 固定並驗證 FHIR R4/4.0.1 SearchParameter Bundle 的 provenance、版本、來源 URL、抓取日期與 checksum。
- [x] 1.2 建立 `temp/fhir-search-parameters.json` 的一次性差異報告，確認它只作 inventory，不被 Registry、runtime 或 build pipeline 載入。
- [x] 1.3 以 production resource catalog 建立 146 種 resource 與所有 `(resourceType, code)` lookup matrix。
- [x] 1.4 為每個 lookup 分類 `compiled`、可修復 `disabled`、明確 `unsupported`、`no-lookup` 與 fixture coverage 狀態。
- [x] 1.5 將 lookup completeness、source identity、active conflict 與 status policy 加入 diagnostics 驗證。

## 2. Fixture archive 與 migration manifest

- [x] 2.1 為每個 resource 建立固定 official example mapping，驗證 `resourceType` 並記錄來源檔案 hash。
- [x] 2.2 將選定 official examples 歸檔至版本控制的正式 fixtures，保留原始內容不被測試 mutate。
- [x] 2.3 為 official example 缺少必要欄位的 lookup 建立 derived fixture，記錄每個 augmentation。
- [x] 2.4 為沒有 official example 的 resource 建立最小合法 synthetic fixture，明確標記 synthetic source。
- [x] 2.5 定義並產生可重現的 migration manifest，包含 source、resource、lookup、plan、fixture、expected hit-set、diagnostics 與 enablement。
- [x] 2.6 建立 manifest drift verification，當 Bundle、example、plan 或 expected hit-set hash 改變時明確失敗。

## 3. Compiler 與 SearchQueryPlan 完整性

- [x] 3.1 修復所有可支援的 parser、AST validation、Resource type map 與 search-type projection failure。
- [x] 3.2 驗證每個 `(resourceType, code)` 都產生獨立 typed SearchQueryPlan，避免 multi-base 或 union branch 污染。
- [x] 3.3 完成 choice、union、nested path、incompatible branch 與 typed extraction path 的全量 compiler tests。
- [x] 3.4 完成 number、date、string、token、reference、quantity、uri 的 comparator、modifier、multipleOr、multipleAnd 與 `:missing` contract。
- [x] 3.5 將 `composite`、`special`、無 expression 與未 allowlist 語意分類為穩定 unsupported diagnostics。
- [x] 3.6 確認所有非 unsupported compiler failure 都已修復或被明確阻擋，不能留下 unclassified outcome。

## 4. Reference、chain 與 control metadata

- [x] 4.1 將 reference target、extraction path、同一 array element correlation 與 supported value forms 納入 Registry metadata/plan。
- [x] 4.2 實作並測試一層 declared reference chain，驗證 target lookup、depth、cycle guard 與 cost limit。
- [x] 4.3 將 `_include` 與 `_revinclude` 的 reference path、target type、合法關係與錯誤行為改由 Registry metadata 驅動。
- [x] 4.4 將 conditional delete filter 改由與 normal search 相同的 Registry-derived plan 產生。
- [x] 4.5 將 Bundle GET parameter validation 與 filter construction 改由 Registry lookup，保留 Bundle transaction 與其他 control pipeline。
- [x] 4.6 將 Bundle resource type/id URL helpers 從 SearchParameter-specific `fhir-param` 邏輯分離。

## 5. Runtime migration 與一致性測試

- [x] 5.1 將所有 production resource 的 normal search 切換為 Registry-first，並禁止 disabled、unsupported、conflict lookup fallback。
- [x] 5.2 驗證 normal search、conditional delete、Bundle GET、include/revinclude 與 one-level chain 使用一致的 lookup semantics。
- [x] 5.3 建立每個 compiled lookup 的 positive hit-set、companion negative hit-set 與適用的 `:missing` 測試。
- [x] 5.4 建立 choice、union、nested array、reference correlation、synthetic fixture 與 no-lookup resource 的 Mongo integration tests。
- [x] 5.5 以 compatibility-plus-corrections 驗證 public search 結果，不以 legacy filter JSON equality 作為 gate。
- [x] 5.6 逐 resource 執行 golden filter、document hit-set、operator/multiplicity、diagnostics 與 structural gates，通過後關閉該 resource fallback。

## 6. SearchParameter CRUD、DB overlay 與 diagnostics

- [x] 6.1 驗證 active DB SearchParameter、canonical overlay、retired/draft policy 與 active conflict 的 Registry 行為。
- [x] 6.2 驗證 SearchParameter CRUD 成功後的 atomic reload、in-flight snapshot consistency 與 reload failure preservation。
- [x] 6.3 將 `search-parameter:diagnostics` 擴充為長期 Registry integrity command，輸出所有 lookup outcome 與 fixture/enablement 狀態。
- [x] 6.4 將 diagnostics completeness、unclassified failure、unknown lookup、conflict 與 manifest drift 納入 CI gate。

## 7. API generator 與 legacy decoupling

- [x] 7.1 修改 API generator，使其停止讀取 `FHIRParametersClean.json` 與產生 SearchParameter handlers，但保留 CRUD、history、validation 等生成能力。
- [x] 7.2 移除所有 controller、service、Bundle 與 conditional delete 對 generated `paramsSearch`/`paramsSearchFields` 的需求。
- [ ] 7.3 將 Registry executor 從 legacy `queryBuild.js` 與 `searchParameterQueryHandler.js` 解耦，保留必要的 type-specific primitives。
- [ ] 7.4 替換或移除 chain、include/revinclude、conditional delete 與 shadow code 中的 legacy imports。
- [ ] 7.5 更新或替換直接測試 legacy query methods 的測試，改測 Registry executor 與 SearchQueryPlan contract。
- [ ] 7.6 執行全 repository import/reference 檢查，確認沒有 runtime、build、test 或 diagnostics call site 依賴 generated handlers。

## 8. Feature flags、script 與 legacy artifact removal

- [ ] 8.1 將 Registry 設為 production 唯一路徑，移除 legacy fallback flag、resource rollout config 與 runtime rollback path。
- [ ] 8.2 移除 `search-parameter:shadow` 及其 runtime comparator、legacy report 與 package script。
- [ ] 8.3 移除 `search-parameter:rollout-status` 及其 shadow report 依賴。
- [ ] 8.4 在所有 deletion gates 通過後移除 generated `*ParametersHandler.js`、`parameterHandler.js`、`searchParameterQueryHandler.js` 與已解耦的 legacy search methods。
- [ ] 8.5 確認沒有任何 runtime/build/test 參照後移除 `FHIRParametersClean.json` 與 SearchParameter-specific `fhir-param` functions。
- [ ] 8.6 清除已完成 migration 工作且不再需要的 temp inventory；保留正式 Bundle、provenance、manifest、fixtures 與生成/驗證腳本。

## 9. Final verification

- [ ] 9.1 執行完整 unit、compiler、golden filter、Mongo integration、API entry-point 與 error-flow tests。
- [ ] 9.2 執行 diagnostics CI gate，確認 146 種 resource 與所有 lookup 都有允許且可追蹤的 outcome。
- [ ] 9.3 執行 production-like startup、Registry preload、DB overlay reload 與 in-flight snapshot verification。
- [ ] 9.4 執行 legacy dependency scan，確認 `FHIRParametersClean.json`、generated handler、shadow 與 rollout-status 已無有效引用。
- [ ] 9.5 確認非 SearchParameter 的 Bundle transaction、URL/id parsing、CRUD、history、validation、pagination、summary 與 response 行為未回歸。
