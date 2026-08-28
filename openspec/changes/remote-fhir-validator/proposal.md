## Why

Burni 仍用 `node-java-fhir-validator` 在 Node process 裡跑 JVM，啟動要 JDK、本機 IG 檔、以及 `utils/validator` 的 profile 載入。已接受的 ADR `docs/adr/0001-remote-fhir-validator.md` 決定改打遠端 Inferno FHIR validator wrapper。程式還沒跟上：文件與 `.env.template` 已寫 `VALIDATOR_URL`，`processor.js` 仍呼叫 in-process Java。

## What Changes

- 拿掉 in-process Java validator（`node-java-fhir-validator`、`utils/validator/index.js` 的 IG 載入、`server.js` 啟動時 require validator）。**BREAKING**：本機 `utils/validator/igs` 不再被讀取。
- 保留 `ENABLE_VALIDATOR`。`true` 時 create、update、Bundle 寫入、`$validate` 會等遠端 Validator；`false` 時仍只做 mongoose 結構檢查。`$validate` 不是功能開關，永遠存在。
- 新增 `VALIDATOR_URL`：Inferno `POST /validate` 的完整絕對 `http`/`https` URL。Burni 不自行補 `/validate`。`ENABLE_VALIDATOR=true` 時必填，缺漏或格式不對則啟動失敗。
- 依 ADR 一併加入選填 `VALIDATOR_TIMEOUT_MS`（正整數毫秒，預設 `30000`）。未填用預設；填了但不是正整數則啟動失敗。
- Validator 成功回傳時，Burni 直接使用該 FHIR OperationOutcome（不改寫 issue）。error 或 fatal 為 422；僅 information 或 warning 為 200。
- Validator 連不上或逾時回 503，body 不是 OperationOutcome 回 502。兩者都用 Burni 自己組的 OperationOutcome，且不寫入 resource。不 retry、啟動時不 ping Validator。
- 退役 `ENABLE_CSHARP_VALIDATOR`、`VALIDATION_API_URL`、`VALIDATION_FILES_ROOT_PATH`（程式裡已無引用，文件維持已退役）。
- Docker image 不再以 JDK 為 base。文件（README、docker README、llms.mdx）已描述遠端 Validator，實作須對齊既有文件，不另開一套行為。

## Capabilities

### New Capabilities

- `fhir-validator`: 以 `ENABLE_VALIDATOR` 與 `VALIDATOR_URL` 呼叫遠端 Validator，並把 OperationOutcome 對應到 create、update、Bundle 寫入、`$validate` 的 HTTP 結果。

### Modified Capabilities

- （無既有 `openspec/specs/` capability）

## Impact

- `utils/validator/`：`index.js` 不再嵌入 Java；`processor.js` 改 `POST` `VALIDATOR_URL`。
- `server.js`：啟動時改檢查 env，不再等 DB 後載入 JVM validator。
- `api/FHIRApiService/services/base.service.js`、`$validate.js`：沿用 `validateResource`，但 502/503 不可再一律當 422 或 500。
- `package.json`：移除 `node-java-fhir-validator`。既有 `node-fetch`、`abort-controller` 用來打 HTTP。
- `Dockerfile`：離開 `eclipse-temurin:17-jdk-jammy`。
- `.env.template`、`build/init.js` 產生的範例 env：補上 `VALIDATOR_URL` / `VALIDATOR_TIMEOUT_MS`。
- 對外 FHIR API 路徑不變。行為差在 Validator 啟用時改走 HTTP，以及不可用時的 502/503。
