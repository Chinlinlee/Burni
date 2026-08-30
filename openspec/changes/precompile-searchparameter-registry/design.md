## Context

See proposal.md for motivation. Application ready 仍等待 SearchParameter registry reload（`optimize-model-loading`）。目前 `reloadRegistry()` 對 1375 個 builtin definition 同步呼叫 compiler，並在 diagnostics verify／CI gate 再 compile 一次。官方 Bundle、`models/FHIR/searchParameter/compiler/` 與 `api_generator/to-code-use-definition/` 在 runtime 是靜態輸入。SearchParameter CRUD 已會觸發 reload；開機時資料庫 overlay 常為空，但不保證一直為空。

既有 `npm run search-parameter:build-artifacts` 已會做全量 compile 並寫入 migration artifacts，但 runtime 不讀那些檔案。`npm run build` 只產生 FHIR API／model，不產生 SearchParameter plans。

## Goals / Non-Goals

**Goals:**

- 讓預設 registry reload 與 application ready 改走 committed compile artifact + 資料庫 overlay。
- 讓 identity mismatch 在 fast profile、diagnostics CI 與 `ready` 三處都以同一套 hash 失敗。
- 讓 generate 維持單一 compile pass，同時供應 runtime 與 migration 產物。
- 保持搜尋語意、activation 政策與 DB overlay 規則不變。

**Non-Goals:**

- 不把 registry compile 移出 `ready`，不延後 HTTP listen。
- 不優化 generate 的全量 compile 耗時，不以毫秒 SLO 作為 CI 門檻。
- 不把 compile artifact 產生串進 `npm run build`。
- 不持久化 activation 結果或含資料庫 overlay 的完整 snapshot。
- 不新增 runtime dependency，不引入 worker thread／平行 compile。
- 不把 runtime artifact 放到 `migration/artifacts/`。

## Decisions

### 以 committed JSON 作為 builtin compile 的 runtime 輸入

在 `models/FHIR/searchParameter/registry/artifacts/` 提交一份 JSON（建議檔名 `compiled-builtin-definitions.json`）。內容為 generate 當下每個 builtin definition 的 parse 結果加上 compile 輸出（`lookupPlans`、compilable、compiler diagnostics），**不含** AST（executor 只用 extraction paths）、**不含** activation overlay、**不含**資料庫 overlay。

Boot／預設 reload：對官方 Bundle 檔做 checksum（不 `JSON.parse` Bundle）、對 compiler 與 type maps 目錄做 SHA-256、與 header／body checksum 比對；通過後 hydrate、套用 activation、compile 資料庫 overlay、merge、建立 snapshot。

替代方案是 runtime disk cache 或 deploy 時現場 generate。前者在 CI／容器冷檔案系統 miss，救不了 production cold start；後者只是把 143 秒換到 start 之前。兩者都不採用。

### Identity 涵蓋 Bundle、compiler、type maps 與 body

Header 使用 SHA-256，與既有 provenance checksum 同一演算法：

- 官方 Bundle 檔 checksum
- `models/FHIR/searchParameter/compiler/` 目錄（穩定排序相對路徑後逐檔 hash 再合成）
- `api_generator/to-code-use-definition/` 目錄（同上）
- artifact body checksum（definitions 序列化本體，不含 header）

Runtime 與 verify 重算這組值並比對。不採用只鎖 Bundle、也不採用手寫 version constant。Activation 政策不進 identity：artifact 存的是 compile 輸出，activation 每次 reload 重跑。

### Runtime 禁止編譯預設 builtin；generate 是唯一入口

`connector.js` 的 `reloadRegistry()` 不得傳非預設 Bundle 路徑。預設路徑在 artifact 缺失或 stale 時 fail closed，錯誤訊息指出 `npm run search-parameter:build-artifacts`。Process 內第一次成功 hydrate 後，後續 CRUD reload 重用記憶體中的 builtin compile 結果，只重抓／編譯 overlay。

測試可用非預設 `bundlePath` 走 live compile。Generate script 直接呼叫 compiler，不得靠「禁止 compile 的」預設 `reloadRegistry()` 來生自己；寫出 artifact 後，同一批 definitions 再產 migration artifacts。

替代方案是 miss 時 fallback 全量 compile。那會把忘了 regenerate 藏成效能問題，違反 fail closed，因此不採用。

### `npm run build` 不串 generate

Type maps 變更會讓 identity 失效，boot／fast profile／CI 會失敗，直到維護者跑 SearchParameter generate。不把 143 秒藏進 API 產生流程，也不做「偵測到 hash 變化才串」的不穩定 `build`。

### 驗證以契約為準，不以毫秒門檻

回歸測試斷言預設 reload 不會編譯 builtin，並斷言 identity 失敗會 reject ready／非零退出。既有階段耗時 log 保留為觀察值。Generate 全量 compile 的快慢不在本 change 範圍。

Fast profile 新增無 MongoDB 的 identity 測試，讓日常 `npm test` 就能抓住忘了 regenerate。Diagnostics verify 與 CI gate 改讀 hydrate 後 snapshot，刪除它們自己的 live compile 迴圈。

### README 擴充既有維護命令段落

更新根目錄 README 的 SearchParameter maintenance commands：何時跑 `search-parameter:build-artifacts`、該指令會同時更新 runtime compile artifact、以及 `npm run build` 不會做這件事。不另開 README。

## Risks / Trade-offs

- [Committed artifact 體積為數 MB JSON] → 用 git 換掉每個 process 的 143 秒；不存 AST。若後續過大再另開壓縮／拆檔 change。
- [Generate 寫壞 body 但 header hash 碰巧對得上] → body checksum 進 header，boot／verify 一併檢查。不在每個 PR live compile 當雙重保險。
- [切換 fail closed 時 repo 還沒有 artifact] → 實作順序先讓 generate 寫檔並提交，再把預設 reload 改成 hydrate。
- [改 type maps 後 `npm run build` 仍綠、server 卻起不來] → fast profile identity 測試與 README 明示第二個指令；這是刻意的失敗可見性。
- [測試覆寫 Bundle 仍可能慢] → 僅限明確 `bundlePath` 測試，不進 production 啟動路徑。

## Migration Plan

1. 擴充 `search-parameter:build-artifacts`：一次 compile pass 寫入 runtime artifact（header + body）並更新既有 migration artifacts。
2. 執行 generate、提交 artifact。此時 runtime 仍可 live compile，服務不會中斷。
3. 將預設 `reloadRegistry` 改為 identity + hydrate + overlay compile；缺失／stale 則失敗。
4. 讓 diagnostics verify／CI gate 與 connector ready 走同一條 hydrate 路徑；新增 fast profile identity 測試。
5. 更新 README。
6. 回退：恢復預設 live compile 並可選擇留下未再被 runtime 讀取的 artifact。
