## 1. Composite plan model and compiler

- [ ] 1.1 擴充 SearchQueryPlan、registry type 與 capability contract，表達 composite root scopes、component metadata、component extraction branches、correlation、cost 與 diagnostics。
- [ ] 1.2 實作兩階段 builtin/overlay compilation，建立以 `url::version` 解析 component definition 的 resolver，並讓 component 缺失、版本不符、composite/special/chained reference 產生穩定 compile diagnostics。
- [ ] 1.3 實作 composite root expression 與 component expression 的 scope-relative path compilation，支援既有 choice、union、type predicate 與 `%resource` 規則，並在 datatype 或 scope 不相容時停用 branch/lookup。
- [ ] 1.4 為 composite extraction branches 計算同一 root scope 的 correlation metadata、required indexes、estimated cost，確保 multi-base lookup 不共用錯誤 resource type map。

## 2. Composite query parsing and Mongo execution

- [ ] 2.1 新增 escape-aware composite value parser，支援未跳脫 `$` component split、未跳脫 `,` Pair OR、`\$`/`\,`/`\|`/`\\` 還原，以及固定 component 數量驗證。
- [ ] 2.2 將每個 component token 交給被引用 SearchParameter 的既有 search-type、comparator、modifier、temporal、reference 與 value validation，拒絕 composite parameter modifier 與不支援 operator。
- [ ] 2.3 實作 correlated component filter builder，將 component primitive filters 組合為 scalar `$and`、同陣列 scope `$elemMatch` 與 union branch `$or`，並禁止不同陣列元素交叉匹配。
- [ ] 2.4 實作 Pair list OR 與重複 query parameter AND 的 filter composition，沿用 query cost limit、Mongo operator safety assertion 與既有 invalid search value error contract。
- [ ] 2.5 將 registry runtime dispatch 接到 composite plan，確保 disabled/unknown composite 不會呼叫 generated legacy handler，也不會退化成未關聯的獨立 component filter。

## 3. Registry activation and generated artifacts

- [ ] 3.1 移除 composite unconditional unsupported activation/compiler 分支，改以 composite compilation outcome 決定 effective active 或 disabled，並保留 source status、component identity 與 diagnostics。
- [ ] 3.2 更新 compiled artifact sanitize/hydrate 與 registry snapshot path，使 active composite plan 可從 committed artifact 載入，database overlay 仍只在 reload 時編譯。
- [ ] 3.3 執行既有 SearchParameter artifact generate command，重建 compiled builtin definitions、lookup matrix、migration manifest、hit-sets、resource enablement 及其必要 fixture provenance。
- [ ] 3.4 驗證 regenerated artifacts 的 bundle/compiler/type-map identity、body checksum、manifest drift、完整 lookup outcome 與 resource enablement gate。

## 4. Tests

- [ ] 4.1 新增 composite parser unit tests，覆蓋單一 Pair、comma OR、重複參數 AND、所有 escaping、空/缺漏/過多 component、trailing escape 與 modifier rejection。
- [ ] 4.2 新增 composite compiler tests，覆蓋 canonical component resolution、component type/operator validation、multi-base union、choice/%resource path、unsupported component diagnostics 與 plan metadata。
- [ ] 4.3 新增 Mongo filter shape tests，覆蓋 Observation component code/value、useContext、relatesTo、同元素 positive，以及不同陣列元素 cross-match negative。
- [ ] 4.4 新增 registry/artifact tests，驗證 active composite hydrate、disabled composite diagnostics、database overlay、artifact identity 與 registry-only runtime path。
- [ ] 4.5 新增 integration tests，至少涵蓋 `Observation?code-value-quantity=...$gt5.4`、`Observation?component-code-value-quantity=...$lt60`、`Group?characteristic-value=gender$mixed,owner$Eve`、repeated Pair AND 與 HTTP 400 malformed queries。
- [ ] 4.6 執行既有 search-parameter migration/diagnostics gates，確認非-composite golden filters、hit-sets、resource catalog 與 legacy-removal contract 沒有回歸。

## 5. Documentation and verification

- [ ] 5.1 更新 SearchParameter 使用文件，記錄 composite Pair、OR/AND、escaping、同元素 correlation、component 限制與錯誤行為。
- [ ] 5.2 執行 targeted compiler/executor/registry/integration tests 與 artifact verification，修正本變更引入的 lint 或 test failures。
- [ ] 5.3 執行 `npm test` fast profile；在 MongoDB 可用時執行對應 full profile 或 targeted integration suite，並保存驗證結果。
