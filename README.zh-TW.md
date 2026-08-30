<div>
    <h1>Burni FHIR Server</h1>
    <a href="README.md">English</a>
    <span> | </span>
    <strong>繁體中文</strong>
    <br />
    Burni 使用 Node.JS 、Express 框架以及 MongoDB 實作 FHIR R4 Server，經由簡單的設定即可產生指定 FHIR Resource的 Mongoose Schema、API程式碼並可自行更改，滿足需求。目前Burni支援Windows以及Linux，讓開發人員可以快速架設 FHIR Server。

    Burni 所使用的 FHIR 版本為 v4.0.1。
</div>

## Server 能力聲明
Burni 使用 AEGIS Touchstone Basic-R4-Server 測試.

測試結果:
* [FHIR4-0-1-Basic-Server version 18](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server&sVersion=18&testSystem=5f9518730a120e4edef042ae&supportedOnly=false&cb=%2fFHIR4-0-1-Basic&format=ALL&published=true) (2,216 tests has been passed, 100% Pass)
* [FHIR4-0-1-Basic-Server version 14](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server&sVersion=14&testSystem=5f9518730a120e4edef042ae&supportedOnly=false&cb=%2FFHIR4-0-1-Basic&published=true) (1,948 tests has been passed, 100% Pass)
   
## 支援功能
This server supported FHIR RESTFul API below:
- create (e.g. POST http://example.com/fhir/Patient)
- read (e.g. GET http://example.com/fhir/Patient/example)
- update (e.g. PUT http://example.com/fhir/Patient/example)
- delete (e.g. DELETE http://example.com/fhir/Patient/example)
- search (e.g. http://example.com/fhir/Patient?_id=example)
- history-type (e.g. http://example.com/fhir/Patient/1/_history)
- history-type-version/vread (e.g. http://example.com/fhir/Patient/1/_history/1)


<font color=red>**Don't remove Bundle.js in models/mongodb/FHIRTypeSchema**</font>

## 必要環境
- node.js >= 16
- MongoDB >= 4
- 若 `ENABLE_VALIDATOR=true`，需另開 [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper)

## 安裝
```bash=
npm install
```

## 設定

設定檔位於 `config\config.js`
```javascript=
module.exports = {
    // add the resource name that you need
    "Patient" : { 
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    }
}
```
dotenv in root path `.env`
```=
MONGODB_NAME="dbName"
MONGODB_HOSTS=["mongodb"]
MONGODB_PORTS=[27017]
MONGODB_USER="myAdmin"
MONGODB_PASSWORD="MymongoAdmin1"
MONGODB_IS_SHARDING_MODE=false
MONGODB_SLAVEMODE=false

SERVER_PORT=8080 

FHIRSERVER_HOST="localhost"
FHIRSERVER_PORT=8080 #use by creating bundle url
FHIRSERVER_APIPATH="fhir"

#If u want to use token auth, add below.
ENABLE_TOKEN_AUTH=true
ADMIN_LOGIN_PATH="adminLogin"  
ADMIN_USERNAME="adminUsername"
ADMIN_PASSWORD="adminPassword"

ENABLE_CHECK_ALL_RESOURCE_ID=false #true that want to check resource id cross all resource
ENABLE_CHECK_REFERENCE #true that want to check reference is exist in resource content
    
ENABLE_VALIDATOR=true
VALIDATOR_URL=http://localhost:4567/validate
VALIDATOR_TIMEOUT_MS=30000
```
設定後, 執行 `npm run build` 產生 resource 相關程式碼
```
npm run build
```
> TypeError: genParamFunc[type] is not a function 代表此類型的搜尋參數目前不支援。

### SearchParameter 維護指令

Registry 是 production SearchParameter 唯一的執行路徑。以下指令用來維護及驗證版本控制中的來源與測試 artifacts：

- `npm run search-parameter:diagnostics` 產生 Registry integrity report 至 `temp/search-parameter-diagnostics-report.json`。用於本機調查，不是 CI gate。
- `npm run search-parameter:verify` 執行 provenance、lookup 完整性、conflict、compiler diagnostics 與 manifest drift 的嚴格驗證；驗證失敗時回傳失敗狀態，並由 CI 執行。
- `npm run test:diagnostics-gate` 執行 Mocha diagnostics contract，包含 production resource 與 lookup coverage 的固定檢查，並由 CI 執行。
- `npm run search-parameter:build-artifacts` 重新產生版本控制中的 runtime compile artifact（`models/FHIR/searchParameter/registry/artifacts/compiled-builtin-definitions.json`）以及 migration artifacts（lookup matrix、example mapping、fixture archive、hit-set、migration manifest、resource-enablement）。在官方 SearchParameter Bundle、compiler 行為、`api_generator/to-code-use-definition` 下的 type maps 或 fixture corpus 改變時執行；需要重新搜尋官方 examples 時設定 `FHIR_EXAMPLES_DIR`。預設 registry 啟動會 hydrate 此 compile artifact；缺失或過期時 application readiness 會 reject。
- `npm run search-parameter:discover-examples -- <hl7-examples-dir>` 掃描 HL7 FHIR examples 目錄，並更新 `models/FHIR/searchParameter/migration/artifacts/example-mapping.json`。這是維護者指令，不會在服務啟動時執行。

版本控制中的 canonical source 是 FHIR R4/4.0.1 SearchParameter Bundle。Legacy inventory 檔案不是 runtime input，也不會由上述指令重新產生。`npm run build` 不會重新產生 SearchParameter compile artifact；上述輸入變更時請另外執行 `search-parameter:build-artifacts`。

## 啟動服務
```
node server.js
```

### RESTful API
- get (search)
    - Number
    - Date (DateTime, Instance Not yet)
    - String
    - Token
    - Reference
>GET http://example.com/fhir/Patient

- getById (read)
>GET http://example.com/fhir/Patient/123
- getHistoryById (history, vread)
>GET http://example.com/fhir/Patient/_history/

> GET http://example.com/fhir/Patient/_history/1
- putById (update)
> PUT http://example.com/fhir/Patient/1
- deleteById (delete)
> DELETE http://example.com/fhir/Patient/1

### 範例
詳細使用 Postman 的範例： [Examples Using Postman](https://github.com/Chinlinlee/Burni/blob/main/examples/Examples.md)

# FHIR 驗證
Profile validation 打遠端 [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper)。Burni 把 resource JSON `POST` 到 `VALIDATOR_URL`，使用回傳的 OperationOutcome。IG 在那個服務載入，不在 Burni。

- `ENABLE_VALIDATOR=true` 時必須設定 `VALIDATOR_URL`（絕對 `http`/`https`，且含 `/validate`）。`VALIDATOR_TIMEOUT_MS` 選填，預設 `30000`。
- 這個開關不是 `$validate` 的開關。`$validate` 永遠存在。關掉時只做 mongoose 結構檢查。
- OperationOutcome 有 error 或 fatal 回 422。連不上或 timeout 回 503。回應不是 OperationOutcome 回 502。

見 [ADR 0001](docs/adr/0001-remote-fhir-validator.md)。

# 測試

`npm test` 執行完整 Mocha。`npm run lint` 執行 ESLint。

`npm run test:all-resource-crud` 會對 `models/FHIR/fhir.resourceList.json` 中的每種 resource 執行具名 create/read round-trip。catalog 新增 resource 後，coverage 會自動要求對應案例；缺少 fixture provenance、active fixture 或 MongoDB model 時，該案例會失敗，錯誤訊息會帶 resource type。catalog 數量改變時，請同步更新 `test/support/fhir/resource-catalog.js` 的 `EXPECTED_RESOURCE_COUNT`。詳見 `docs/adr/0005-all-resource-crud-coverage.md`。

# TODO
- Search parameters
    - [ ] composite
    - [ ] uri  

- [ ] Narrative generate

## Special project
- [Raccoon](https://github.com/cylab-tw/raccoon) - a noSQL-based DICOMWeb Server.
- [ngs2fhir](https://github.com/cylab-tw/ngs2fhir) - Convert the next generation sequencing (NGS) data to the FHIR Resources.
