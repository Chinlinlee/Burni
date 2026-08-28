## Context

見 `proposal.md` 的 Why。程式仍走 `utils/validator/index.js` 的 `node-java-fhir-validator`：啟動後等 Mongo 連上才 `require` validator，並從 `utils/validator/igs` 載入 JSON profile。`processor.js` 的 `validateResource` 回 `{ isError, message }`，`message` 已是 OperationOutcome。`base.service.js` 與 `$validate.js` 在 `isError` 時一律 422；fetch 例外會落到 create/update 的 500 catch。ADR 與現有文件已規定遠端 Inferno `POST /validate`、502/503、以及 boot 檢查。既有依賴含 `node-fetch` 與 `abort-controller`。Dockerfile 目前是 `eclipse-temurin:17-jdk-jammy` 再裝 Node 18。

## Goals / Non-Goals

**Goals:**

- 用同一個 `validateResource` 出口服務 create、update、Bundle 寫入、`$validate`，回傳值能區分 200、422、502、503。
- 啟動只檢查 env，不連 Validator、不載 IG。
- 拿掉 JDK 與 `node-java-fhir-validator`，Docker 改 Node base image。

**Non-Goals:**

- 不實作 FHIR `{base}/{type}/$validate` 作為 Validator 協定。
- 不在 Burni 載入、同步、或管理 IG。
- 不 retry、不 circuit breaker、不 startup health check。
- 不解析 `$validate` 的 Parameters 或 `?profile=`。
- 不重寫已對齊 ADR 的 README / docker README / llms.mdx，除非實作後發現文件與程式不一致。

## Decisions

### 1. `validateResource` 加 `code`，呼叫端不再寫死 422

沿用 `{ isError, message }`，加上 `code`（200、422、502、503）。`message` 永遠是 OperationOutcome。`BaseFhirApiService.validateRequestResource` 與 `$validate.js` 用這個 `code`。Timeout 與連線失敗在 processor 內轉成 503 結果，不往外 throw，避免 create/update 的 catch 變成 500。

其他做法：丟 `FhirValidationError` / `FhirWebServiceError`。Caller 已經吃 return object，擴欄位改動較小。

### 2. HTTP 用既有 `node-fetch` 與 `AbortController`

`POST` JSON 到 `VALIDATOR_URL`，`Content-Type: application/json`。有 `meta.profile` 時用 URL query `profile`（comma-joined），不改 path。Timeout 用 `AbortController` + `VALIDATOR_TIMEOUT_MS`。不新增 HTTP client。

Inferno 的 HTTP status 不決定 Burni 的 status。Body 能 parse 成 `resourceType === "OperationOutcome"` 就當 OperationOutcome，再依 issue severity 對 200/422。連線失敗、timeout、abort 為 503。JSON 解析失敗或 `resourceType` 不是 OperationOutcome 為 502。

### 3. Boot 檢查獨立於 Mongo

`dotenv` 之後、聽 port 之前檢查：`ENABLE_VALIDATOR === "true"` 時驗證 `VALIDATOR_URL`（`http:` / `https:` 絕對 URL）與 `VALIDATOR_TIMEOUT_MS`（未設則 30000；有設必須是正整數字串）。失敗則 log 後 `process.exit(1)`。刪除 `server.js` 裡等 DB 再 `require("./utils/validator").validator` 的 interval。`ENABLE_VALIDATOR` 不是 `true` 時不讀那兩個變數。

### 4. 拿掉 in-process Java 模組

刪除或清空 `utils/validator/index.js` 對 `FhirValidator` 與 `igs` 的依賴。`processor.js` 不再 `require("./index.js")`。`package.json` 移除 `node-java-fhir-validator`。若 repo 裡還有 `utils/validator/igs`，不再讀它。

502/503 的 OperationOutcome 用現有 `handleError.exception`，diagnostics 說明 unreachable、timeout、或 body 不是 OperationOutcome。不新發明 issue code。

### 5. Docker 改 Node image

`Dockerfile` 改 `node:18-bookworm-slim`（與現有 `NODE_VERSION 18.17.0` 同大版），用 npm 裝依賴與 pm2，不再從 Temurin JDK 裝 nvm。這是拿掉 JVM 的實際後果，不是另開需求。

### 6. 測試對準 mapping 與 HTTP 失敗路徑

專案已有 mocha/chai。測 outcome mapping（error/fatal → 422、warning → 200、非 OO → 502）以及 timeout/連線失敗 → 503。HTTP 以可替換的 `fetch`（預設 `node-fetch`）注入，避免為測試加 nock。

## Risks / Trade-offs

- [Validator 慢會卡住寫入] → 可設 `VALIDATOR_TIMEOUT_MS`。Timeout 失敗關閉（503、不寫入），不拉長預設值。
- [Inferno 未起來但 ENABLE_VALIDATOR=true] → 啟動仍成功（不 ping）。第一個寫入或 `$validate` 才 503。這是 ADR 的取捨。
- [Docker 離開 JDK image] → 舊自建腳本若假設 Temurin 會壞。文件已改遠端 Validator。Rollback 只能 revert 這次變更。
- [create.service catch 仍可能把未預期 throw 變成 500] → processor 涵蓋 timeout、網路、非 OO。其餘例外維持 500。

## Migration Plan

1. 另開 [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper)，在該服務載入 IG。
2. 設 `VALIDATOR_URL` 為完整 `POST /validate` URL，需要時設 `VALIDATOR_TIMEOUT_MS`。
3. `ENABLE_VALIDATOR=true` 後重啟 Burni。本機 `utils/validator/igs` 不再有效。
4. Rollback：把 `ENABLE_VALIDATOR` 設回 `false` 只回到 mongoose 結構檢查，不會恢復 in-process Java。要回 Java 只能 revert code。
