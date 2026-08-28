<div>
    <div style="float: left;width: 15%;"><img src="https://github.com/Chinlinlee/Burni/blob/main/public/logo.png?raw=true" width="90px">
     <h1>Burni FHIR Server</h1>
    <strong>English<strong>
    <span> | </span>
    <a href="README.zh-TW.md">繁體中文</a>
    <br />
    Burni is a user-friendly implementation of the FHIR server built using Node, Express, and MongoDB. It offers a straightforward way for developers to customize the <a href="https://www.hl7.org/fhir/">HL7 FHIR® specification</a>, with support for both Windows and Linux environments, making it easy to deploy a FHIR service. Burni allows you to import your <a href="https://www.hl7.org/fhir/implementationguide.html">Implementation Guide<a> and store FHIR Resources, while also creating FHIR RESTful APIs.<br> 
    Burni uses version 4.0.1 (R4) of the HL7 FHIR specification.
</div>

## Conformance Statement 
Burni has been tested  by AEGIS Touchstone Basic-R4-Server. The conformance results show below: 
* [FHIR4-0-1-Basic-Server version 23](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server&sVersion=23&testSystem=5f9518730a120e4edef042ae&supportedOnly=false&cb=%2fFHIR4-0-1-Basic&format=ALL&published=true) (2,282 tests has been passed, 100% pass)
* [FHIR4-0-1-Basic-Server version 18](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server&sVersion=18&testSystem=5f9518730a120e4edef042ae&supportedOnly=false&cb=%2fFHIR4-0-1-Basic&format=ALL&published=true) (2,216 tests has been passed, 100% Pass)
* [FHIR4-0-1-Basic-Server version 14](https://touchstone.aegis.net/touchstone/conformance/detail?suite=FHIR4-0-1-Basic-Server&sVersion=14&testSystem=5f9518730a120e4edef042ae&supportedOnly=false&cb=%2FFHIR4-0-1-Basic&published=true) (1,948 tests has been passed, 100% Pass)
   
## features
This server supported FHIR RESTFul API below:
- create (e.g. POST http://example.com/fhir/Patient)
- read (e.g. GET http://example.com/fhir/Patient/example)
- update (e.g. PUT http://example.com/fhir/Patient/example)
- delete (e.g. DELETE http://example.com/fhir/Patient/example)
- search (e.g. http://example.com/fhir/Patient?_id=example)
- history-type (e.g. http://example.com/fhir/Patient/1/_history)
- history-type-version/vread (e.g. http://example.com/fhir/Patient/1/_history/1)


<font color=red>**Don't remove Bundle.js in models/mongodb/FHIRTypeSchema**</font>

## Requirements
- node.js >= 16
- MongoDB >= 4
- A running [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper) if `ENABLE_VALIDATOR=true`

## Installation
```bash=
npm install
```

## configure

The resources config in `config\config.js`
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
SERVER_SESSION_SECRET_KEY="secretKey"

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
After configuration, run `npm run build` to generate resources
```
npm run build
```
> TypeError: genParamFunc[type] is not a function mean that search parameter method not support
## Usage
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

### Examples

The details of postman's request body and response: [Examples Using Postman](https://github.com/Chinlinlee/Burni/blob/main/examples/Examples.md)

## Validation
Profile validation is a remote [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper). Burni `POST`s the resource JSON to `VALIDATOR_URL` and uses the OperationOutcome. Load IGs on that service, not in Burni.

- `ENABLE_VALIDATOR=true` requires `VALIDATOR_URL` (absolute `http`/`https`, including `/validate`). Optional `VALIDATOR_TIMEOUT_MS` defaults to `30000`.
- That flag does not turn `$validate` on or off. `$validate` always exists. Disabled means mongoose structure validation only.
- Error or fatal issues in the OperationOutcome are 422. Unreachable or timeout is 503. A non-OperationOutcome body is 502.

See [ADR 0001](docs/adr/0001-remote-fhir-validator.md).

## TODO
- Search parameters
    - [ ] composite
    - [ ] uri  

- [ ] Narrative generate

## Special project
- [Raccoon](https://github.com/cylab-tw/raccoon) - a noSQL-based DICOMWeb Server.
- [ngs2fhir](https://github.com/cylab-tw/ngs2fhir) - Convert the next generation sequencing (NGS) data to the FHIR Resources.
