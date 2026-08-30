## Why

SearchParameter registry 在每個 process 啟動時對 1375 個官方 R4 builtin definition 同步編譯，佔 application initialization 約 143 秒（總啟動約 152 秒）。`mongodb.ready` 與 `server.js` listen 都等待這段完成，production cold start 與任何 `await ready` 的測試都付同一筆成本。官方 Bundle、compiler 與 type maps 在 runtime 是靜態輸入，不該在每個 process 重算。

## What Changes

- 將 builtin SearchParameter 的 compile 結果做成 **committed build-time artifact**，放在 runtime registry 目錄並納入版本控制。
- 預設 `reloadRegistry()`（含 connector 的 application ready 路徑）對 builtin **MUST NOT** 呼叫 `compileDefinition`；只核對 identity、hydrate artifact、compile 資料庫 overlay、再做 activation／merge／snapshot。
- Identity 以 SHA-256 涵蓋官方 Bundle checksum、compiler 目錄與 `api_generator/to-code-use-definition` type maps，並包含 artifact body checksum。
- Artifact 缺失或 identity 不符時，application readiness SHALL reject（fail closed）。錯誤訊息 MUST 指出 generate 指令。
- 唯一準許編譯預設 builtin 的入口是既有 generate 指令的一次 compile pass；該次同時寫入 runtime artifact 與既有 migration artifacts。
- `npm run build` MUST NOT 串接此 generate。`reloadRegistry({ bundlePath })` 僅供測試覆寫來源；connector MUST NOT 使用該豁免。
- SearchParameter CRUD reload 只重算資料庫 overlay，重用 process 內已 hydrate 的 builtin compile 結果。
- Fast profile 新增無 MongoDB 的 identity 測試。Diagnostics verify／CI gate 改為 identity + hydrate，不再 live compile builtin。
- README 的 SearchParameter maintenance commands 說明何時 regenerate，以及 `npm run build` 不會做這件事。

## Capabilities

### New Capabilities

### Modified Capabilities

- `fhir-searchparameter-registry`: 預設載入改為 committed compile artifact + 資料庫 overlay；runtime 禁止編譯預設 builtin；identity 失敗不得 application ready。
- `test-suite-speed`: 快速 profile 必須包含無 MongoDB 的 artifact identity 檢查；diagnostics CI 不得再對 builtin 做 live compile。

## Impact

- 影響 `registryManager`、source／compiler 呼叫邊界、`search-parameter:build-artifacts`、`search-parameter:verify`、diagnostics CI gate 與 README。
- 新增 `models/FHIR/searchParameter/registry/artifacts/` 下的 committed JSON；不修改 FHIR search API 的查詢語意、activation 政策或 DB overlay 規則。
- Application ready 仍等待完整 registry snapshot；不延後 HTTP listen、不把 compile 移到請求時。
- Generate 全量 compile 的耗時維持現狀，本次不優化。不新增 runtime dependency。
