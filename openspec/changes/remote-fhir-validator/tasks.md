## 1. Boot 設定與移除 Java validator

- [x] 1.1 新增 Validator env 檢查：僅在 `ENABLE_VALIDATOR=true` 時驗證 `VALIDATOR_URL` 為絕對 `http`/`https`，以及 `VALIDATOR_TIMEOUT_MS`（未設預設 30000，有設必須是正整數）。失敗則結束 process。不 ping Validator。
- [x] 1.2 在 `server.js` 於 `dotenv` 之後呼叫該檢查。刪除等 Mongo 連上後 `require("./utils/validator").validator` 的 interval。
- [x] 1.3 移除 `utils/validator/index.js` 對 `node-java-fhir-validator` 與 `igs` 的載入。`processor.js` 不再 require 該模組。

## 2. HTTP `validateResource`

- [x] 2.1 以可注入的 `fetch`（預設 `node-fetch`）`POST` resource JSON 到 `VALIDATOR_URL`，`Content-Type: application/json`。有 `meta.profile` 時加上 comma-joined 的 `profile` query。不改 path、不 retry、不讀 `$validate?profile=`、不拆 Parameters。Timeout 用 `AbortController`。
- [x] 2.2 將結果對成 `{ code, operationOutcome }`，`operationOutcome` 為 OperationOutcome。Validator 的 OO 有 error/fatal 為 422，否則 200（原樣回傳該 OO）。連線失敗或 timeout 為 503（Burni 組 OO，用 `handleError.exception`）。body 不是 OperationOutcome 為 502。Timeout 與網路錯誤不往外 throw。

## 3. 串接寫入與 `$validate`

- [x] 3.1 `BaseFhirApiService.validateRequestResource` 在 Validator 啟用時使用 `validateResource` 回傳的 `code`（422/502/503），失敗時不寫入。`ENABLE_VALIDATOR` 不是 `true` 時維持 mongoose 與 contained 檢查。
- [x] 3.2 `$validate.js` 使用同一個 `code`：200 回 Validator OO，422/502/503 對應 spec。不要把 502/503 收成 500。

## 4. 依賴、Docker、env 範例

- [x] 4.1 從 `package.json` 移除 `node-java-fhir-validator` 並更新 lockfile。
- [x] 4.2 `Dockerfile` 改 `node:18-bookworm-slim`，拿掉 Temurin JDK 與 nvm 安裝 Node。
- [x] 4.3 更新 `build/init.js` 產生的範例 `.env`，補上 `VALIDATOR_URL` 與 `VALIDATOR_TIMEOUT_MS` 註解（`.env.template` 已有則對齊即可）。

## 5. 測試

- [x] 5.1 用 mocha/chai 測 OperationOutcome mapping：error/fatal → 422 且 body 為 Validator OO；僅 warning/information → 200 且 body 為 Validator OO。
- [x] 5.2 測 timeout 與連線失敗 → 503；非 OperationOutcome body → 502。注入假 `fetch`，不新加 nock。
- [x] 5.3 測 `meta.profile` 會進 `profile` query、沒有 profile 則不加、Parameters body 原樣 POST。
