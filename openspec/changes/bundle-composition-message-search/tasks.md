## 1. Bundle special relation metadata

- [x] 1.1 以 canonical Registry metadata 識別 `Bundle::composition` 與 `Bundle::message` 的固定 inline source path、target resource type 與 Bundle type predicate。
- [x] 1.2 保留一般 contained `Resource` extraction path 的不可 chain 行為，僅允許 `Bundle.entry[0].resource` 在 `composition`／`message` 情境成為 inline target。
- [x] 1.3 補充 relation plan 型別與 composer，使 inline target branch 不建立 collection `$lookup`，且 inline hop 仍納入 relation depth、cost 與 per-type target plan。

## 2. Direct identity and Bundle gating

- [ ] 2.1 實作 `composition`／`message` direct identity filter：支援固定 target type 的 bare id、relative `ResourceType/id` 與 `entry[0].fullUrl` absolute URL。
- [ ] 2.2 套用 Bundle type 與 `entry[0].resource.resourceType` 的雙重 gating；缺少或不符合 special first entry 的 stored Bundle SHALL 只是不命中。
- [ ] 2.3 依既有 reference value contract 拒絕 versioned、contained、logical identifier 與錯誤 target type 的 direct value。

## 3. Inline chained aggregation

- [ ] 3.1 讓 `composition.<target-code>` 與 `message.<target-code>` 使用 Composition/MessageHeader 的 effective Registry plan，並將 extraction path 正確 prefix 到 `entry.0.resource`。
- [ ] 3.2 支援 inline target 後的外部 Reference hop；每個 branch 使用自己的 target plan、type filter、correlation 與 terminal typed filter。
- [ ] 3.3 對 `Composition::patient` 保留 `Patient|Group` closed fan-out，對 `MessageHeader::focus` 套用 open-target type-filter requirement；不得搜尋整個 `entry` array。
- [ ] 3.4 驗證 inline path 的 relation depth、path cost、unknown 與三種 limit class 行為，且不得洩漏內部 limit reason。

## 4. Search entry points

- [ ] 4.1 接上 normal search 的 direct 與 chained Bundle special search，並維持 Registry-only lookup 與既有 multiple-value semantics。
- [ ] 4.2 接上 Bundle GET search validation，使 direct、inline chain、unknown 與 relation-limit diagnostics 與 normal search 一致。
- [ ] 4.3 接上 conditional delete 的 direct special search validation；合法 chained special search 驗證通過後仍回既有 chained-search unsupported 訊息。
- [ ] 4.4 確認 `_include`、`_revinclude`、`_has` 與其他 contained Resource 行為未被 inline special branch 改寫。

## 5. Tests and fixtures

- [ ] 5.1 建立有效 document Bundle/Composition 與 message Bundle/MessageHeader fixtures，並加入 positive 與 companion negative hit-sets。
- [ ] 5.2 測試 direct identity、bare id、relative reference、absolute `fullUrl`、wrong target type、versioned/contained/logical identifier。
- [ ] 5.3 測試 `composition.patient` 的 Patient/Group fan-out、`message.focus:Patient` 的 type filter，以及缺 filter 的 `missing-type-filter`。
- [ ] 5.4 測試只在 `entry[0]` 評估、Bundle type gating、invalid stored Bundle 不命中，以及 `entry[1]` 不得造成誤命中。
- [ ] 5.5 測試 normal search、Bundle GET validation、conditional delete 對 unknown、`missing-type-filter`、`relation-depth`、`relation-cost` 的一致 mapping。
- [ ] 5.6 測試多值、terminal modifiers、nested external Reference hop、per-branch typed filters 與 existing one-hop chained search 回溯相容性。

## 6. Documentation and verification

- [ ] 6.1 更新 Bundle 搜尋文件，改用 `entry[0].resource` 與 Registry-driven `composition`／`message` chained examples，移除所有-entry legacy mapping。
- [ ] 6.2 執行 focused Mocha tests，至少涵蓋 relation plan、parameter parsing、compiler plan metadata、Bundle search validation 與 entry-point integration。
- [ ] 6.3 執行 `openspec validate --change "bundle-composition-message-search" --strict`，修正所有 artifact 格式或需求覆蓋問題。
- [ ] 6.4 依 repository profile 執行必要的 fast/full verification；確認不涉及資料遷移與 `SearchQueryPlan.depth` compiler 語意改寫。
