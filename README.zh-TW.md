<div>
    <h1>Burni FHIR Server</h1>
    <a href="README.md">English</a>
    <span> | </span>
    <a href="README.zh-TW.md">繁體中文</a>
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
- read (e.g. GET http://example.com/fhir/Patient/example)
- update (e.g. PUT http://example.com/fhir/Patient/example)
- delete (e.g. DELETE http://example.com/fhir/Patient/example)
- search (e.g. http://example.com/fhir/Patient?_id=example)
- history-type (e.g. http://example.com/fhir/Patient/1/_history)
- history-type-version (e.g. e.g. http://example.com/fhir/Patient/1/_history/1)


<font color=red>**Don't remove Bundle.js in models/mongodb/FHIRTypeSchema**</font>

## 必要環境
- node.js >= 16
- MongoDB >= 4
- Java JDK >= 11 (For validator)

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
```
設定後, 執行 `npm run build` 產生 resource 相關程式碼
```
npm run build
```
> TypeError: genParamFunc[type] is not a function 代表此類型的搜尋參數目前不支援。
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
Burni 使用 [node-java-fhir-validator](https://github.com/Chinlinlee/node-java-fhir-validator) 做驗證
- 您可以將 IG 的 package.tgz 或是 json (StructureDefinition) 檔案放入 `utils/validator/igs`，Burni 將會讀取這些檔案至 validator 當中
- 您必須將 `.env`(dotenv) 內的 `ENABLE_VALIDATOR` 設定為 true 以開啟驗證功能

# TODO
- Search parameters
    - [ ] composite
    - [ ] uri  

- [ ] Narrative generate

## Special project
- [Raccoon](https://github.com/cylab-tw/raccoon) - a noSQL-based DICOMWeb Server.
- [ngs2fhir](https://github.com/cylab-tw/ngs2fhir) - Convert the next generation sequencing (NGS) data to the FHIR Resources.
