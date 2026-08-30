## 1. Artifact format and identity

- [x] 1.1 新增 runtime artifact 的讀寫與 SHA-256 identity 模組：Bundle 檔 checksum、compiler 目錄 hash、type maps 目錄 hash、body checksum；目錄 hash 使用穩定排序的相對路徑。
- [x] 1.2 定義 artifact JSON 形狀（header + builtin parse／compile 輸出），不含 AST、activation overlay 與資料庫 overlay；路徑為 `models/FHIR/searchParameter/registry/artifacts/compiled-builtin-definitions.json`。
- [x] 1.3 實作 identity 核對：缺失、hash 不符或 body checksum 不符時回傳可指出 `npm run search-parameter:build-artifacts` 的錯誤。

## 2. Generate writes the artifact before runtime switches

- [x] 2.1 讓 `search-parameter:build-artifacts` 直接呼叫 compiler 做一次 builtin compile pass，不得依賴預設 `reloadRegistry()` 來產生 compile 結果。
- [x] 2.2 同一 compile pass 寫入 runtime compile artifact，並繼續更新既有 migration artifacts。
- [x] 2.3 執行 `npm run search-parameter:build-artifacts` 並將產生的 runtime artifact 納入版本控制。此時預設 reload 仍可 live compile。

## 3. Default reload hydrates and fail-closes

- [ ] 3.1 將預設 `reloadRegistry()` 改為核對 identity、hydrate artifact、套用 activation、僅編譯資料庫 overlay、再 merge／snapshot。
- [ ] 3.2 Process 內成功 hydrate 後快取 builtin compile 結果，讓後續 CRUD reload 重用它且不重新編譯 builtin。
- [ ] 3.3 Artifact 缺失或 stale 時讓預設 reload 失敗，並讓 application readiness reject。
- [ ] 3.4 保留非預設 `bundlePath` 的測試覆寫 live compile；確認 `connector.js` 只呼叫無覆寫的 `reloadRegistry()`。

## 4. Diagnostics and fast-profile verification

- [ ] 4.1 將 `search-parameter:verify` 與 diagnostics CI gate 改為 identity + hydrate 後的 snapshot，刪除它們對 builtin 的 live compile 迴圈；identity 失敗時非零退出。
- [ ] 4.2 新增無 MongoDB 的 identity 測試，確保它落在快速 profile（不列入 MongoDB exclude），涵蓋相符通過與過期失敗。
- [ ] 4.3 新增或更新 registry 測試：預設 reload 不編譯 builtin、CRUD overlay 仍生效、identity 失敗 reject ready、`bundlePath` 覆寫仍可 compile。

## 5. Documentation and validation

- [ ] 5.1 更新 README SearchParameter maintenance commands：generate 會同時更新 runtime compile artifact 與 migration artifacts、何時必須重跑、以及 `npm run build` 不會做這件事。
- [ ] 5.2 執行快速 profile、`npm run test:diagnostics-gate`、相關 registry focused tests 與 OpenSpec validation。
