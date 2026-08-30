## Context

目前 `.mocharc.js` 使用全域 `test/**/*.test.js`，因此指定測試檔的命令若未停用 config，可能再次載入完整 suite。MongoDB-dependent suite 透過 [test/support/mongo-memory.js](../../../test/support/mongo-memory.js) 個別建立與停止 `MongoMemoryServer`；而 model connector 在同一 process 首次載入時還會註冊完整 model collection。

隔離量測顯示 temporal round-trip 的案例本身約數秒，但整個 process 約需 115 秒，等待主要來自 setup 與 model/database 初始化。現有 [all-resource-crud.integration.test.js](../../../test/integration/FHIR/all-resource-crud.integration.test.js) 的 146-resource coverage 與 Patient 專用測試都是刻意保留的 contract，不將其視為可刪除的重複測試。

## Goals / Non-Goals

**Goals:**

- 提供不啟動 MongoDB 的快速測試 profile，以及涵蓋完整現有測試的完整 profile。
- 讓同一個 Mocha process 重用 MongoDB test database lifecycle，並以 suite cleanup 維持隔離。
- 修正 targeted test 命令的 discovery 行為，並讓 diagnostics gate 真正只執行指定測試。
- 保留完整 FHIR catalog、Patient、temporal 與 SearchParameter coverage。
- 量測並區分 test case、suite setup、database startup 與 teardown 成本。
- 為 `main`、`next`、`dev` 建立一致的 workflow branch policy，並保留 Specimen 修正前的完整 gate 延後條件。

**Non-Goals:**

- 不修改 production model loading、MongoDB connector 的 runtime lifecycle 或 FHIR API。
- 不刪除現有測試，不以 timeout 或測試慢作為刪除依據。
- 第一階段不啟用同一 process 內的平行測試。
- Specimen 尚未修正前，不讓已知失敗的完整測試成為必要 CI gate。

## Decisions

### Separate profiles through explicit discovery rules

快速 profile 使用明確的測試範圍與排除清單，排除所有需要 MongoDB lifecycle 的 suite；完整 profile 保留目前全域測試 discovery。`npm test` 的日常入口與 `test:full` 的完整入口必須能從名稱和設定清楚辨識，targeted commands 則使用 `--no-config` 避免全域 `spec` 合併。

選擇顯式 discovery 而非只依賴資料夾名稱，是因為目前 MongoDB-dependent 測試分散在 `integration`、`searchParameter/migration`、`searchParameter/registry` 與 `support` 等目錄。未來若新增測試，應在 profile 規則或測試分類驗證中明確決定其歸屬。

### Reuse one database server per process

測試支援層維護 process-level 的 MongoDB server 與 connection state。第一次 MongoDB suite 需要時才啟動；後續 suite 重新連線或沿用既有 connection，但不得重新建立 server。各 suite 仍須清理自己使用的 collections，不能把 suite 順序當作隔離機制。

最終 teardown 由 Mocha root hook 統一執行，確保 focused run 與完整 run 都能停止 server。現有 suite 的 stop context 只能釋放 suite 使用的 connection state，不得提前停止 process-level server。

### Keep contract coverage and expose failures

146-resource CRUD、Patient focused integration、temporal suites 與 SearchParameter coverage 均保留。沒有證據顯示孤兒或永久 skip 測試，因此本次只移除重複執行成本，不移除案例。

Specimen 失敗暫時保持可見：完整 profile 可以獨立執行並回傳失敗，但在 Specimen 修正前不接入必要 CI gate。不得用 `skip`、`exclude` 或允許失敗掩蓋該結果。

### Measure lifecycle separately from test cases

基準工具與測試 hook 量測使用單調時鐘，至少記錄快速 profile、完整 profile，以及主要 MongoDB suite 的 setup、案例執行與 teardown 時間。效能結果只用於比較，不改變測試的 assertion、失敗狀態或 coverage。

`this.timeout(120000)` 維持為失敗保護上限；它不是延遲機制。若 setup 超過 timeout，應顯示 hook 失敗與 lifecycle 診斷，而不是調高 timeout 掩蓋問題。

### Delay parallel execution

第一階段維持同一 process 內的序列執行。原因是測試可能共享 Mongoose model registry、環境變數、SearchParameter registry snapshot 與 generated output。取得穩定基準並確認 isolation 後，才另行評估 process-level shard。

### Apply CI policy without enabling the known-red gate

現有 diagnostics workflow 的 `push` 與 `pull_request` branch filter 保留 `main`，並加入 `next`、`dev`。完整測試命令先作為可獨立呼叫的 release/validation entry；待 Specimen 修正且完整 profile 通過後，再接入必要 CI gate。

## Risks / Trade-offs

- [Shared database state] 某個 suite 清理不完整可能污染後續 suite → 要求每個 MongoDB suite 在 setup 或 teardown 明確清除其 collections，並保留 focused 與完整執行驗證。
- [Root cleanup failure] process-level server 未在 focused run 結束時停止可能留下 mongod process → 使用 root hook 統一 teardown，並讓 cleanup 具備重複呼叫安全性。
- [Profile drift] 新增 MongoDB-dependent 測試卻被快速 profile 執行 → 建立 profile 分類檢查，並以測試 discovery 結果驗證快速 profile 不會啟動 MongoDB。
- [Known failing coverage] Specimen 失敗可能被誤認為本次變更造成 → 在完整 profile 與 CI 文件中明確標示現況，待修正後重新建立基準。
- [Model-loading overlap] 測試 lifecycle 優化與 production model loading 優化的效果可能混在一起 → 本 change 不修改 production model loading，並以獨立基準記錄兩者影響。

## Migration Plan

1. 先新增 profile 設定、targeted command 修正與 lifecycle timing，不刪除測試。
2. 將 MongoDB test helper 改為 process-level reuse，執行 focused temporal、Patient 與 support 測試確認 isolation。
3. 執行快速 profile 與完整 profile，記錄 setup、teardown 和案例時間，確認 coverage 數量不變。
4. 更新 workflow branch filter；Specimen 修正前不啟用完整必要 gate。
5. 若 shared lifecycle 導致 isolation 或 cleanup 回歸，回退至 per-suite server，保留 profile 與 targeted command 的獨立改善。
