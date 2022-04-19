# burni docker

The full resources burni FHIR server.

# Environments

|設定名稱                        |資料型態          |說明                                                                             |預設值                                 |
|----------------------------|--------------|-------------------------------------------------------------------------------|------------------------------------|
|MONGODB_NAME                |String        |MongoDB 資料庫的名稱                                                                 |"dbName"                              |
|MONGODB_HOSTS               |Array <String>|要連接的 MongoDB IP 或 網域名稱， e.g. 127.0.0.1、localhost                               |["mongodb"]                         |
|MONGODB_PORTS               |Array<Number> |要連接的 MongoDB IP 的 Port，對應 MONGODB_HOSTS 的順序， e.g. 27017                        |[27017]                             |
|MONGODB_USER                |String        |要連接的 MongoDB 的 使用者帳號                                                           |"user"                                |
|MONGODB_PASSWORD            |String        |要連接的 MongoDB 的 使用者密碼                                                           |"password"                            |
|SERVER_PORT                 |Number        |Server 啟動的 Port                                                                |8080                                |
|FHIRSERVER_HOST             |String        |FHIR Server 對外連接的 IP 或網域名稱，用於產生回傳資料的 URL                                       |"localhost"                           |
|FHIRSERVER_PORT             |Number        |FHIR Server 對外連接的 Port，用於產生回傳資料的 URL                                           |8080                                |
|FHIRSERVER_APIPATH          |String        |使用 FHIR API 的前綴字，e.g. api/fhir ，代表查詢 Patient 使用 http://xxx.com/api/fhir/Patient|"fhir"                                |
|ENABLE_TOKEN_AUTH           |Boolean       |是否開啟驗證機制                                                                       |false                               |
|JWT_SECRET_KEY              |String        |JWT 的 secret key                                                               |"secret-key"                          |
|ADMIN_LOGIN_PATH            |String        |核發 Token 登入頁面的 URL 路徑，e.g. adminLogin即 http://localhost/adminLogin             |"adminLogin"                          |
|ADMIN_USERNAME              |String        |核發 Token 管理者登入帳號                                                               |"admin"                               |
|ADMIN_PASSWORD              |String        |核發 Token 管理者登入密碼                                                               |"password"                            |
|ENABLE_CHECK_ALL_RESOURCE_ID|Boolean       |是否驗證跨 Resource 的 ID ，即 Patient/123 以及 Organization/123 不應該同時存在                 |false                               |
|ENABLE_CHECK_REFERENCE      |Boolean       |是否驗證 Resource 內的 Reference 是否存在                                                |false                               |
|ENABLE_CSHARP_VALIDATOR     |Boolean       |是否開啟 C# 的 API                                                                  |false                               |
|VALIDATION_FILES_ROOT_PATH  |String        |存放驗證功能所使用的 Structure Definition、 Code System 、 Value Set 的路徑                   |"/validationResources "               |
|VALIDATION_API_URL          |String        |C# 驗證器 API 的 Base URL                                                          |"http://burni-fhir-validator-api:7414"|

# Usage
## Step 1: Create network for mongoDB and burni
```sh
sudo docker network create burni-net
```
## Step 2: Run mongodb
```bash
sudo docker run -v $PWD/burni-mongodb/db:/data/db \
--name fhir-burni-mongodb -p 27017:27017 \
-e MONGO_INITDB_DATABASE=admin \
-e MONGO_INITDB_ROOT_USERNAME=root \
-e MONGO_INITDB_ROOT_PASSWORD=root \
-e MONGO_PORT=27017 \
--net burni-net \
mongo:4.4
```
## Step 3: Run burni
### With volume of env file
The amount of environment variables is more than 10, I recommend to use env file and volume to burni work directory.
```sh
sudo docker run -it --rm -v $PWD/.env:/nodejs/fhir-burni/.env \
--net burni-net \
a5566qq123/burni:main
```

---

# With docker-compose
## Pull from docker hub
**⚠ ⚠ 注意！ 您必須先將設定檔設定完成 (`.env`, `config/config.js`)。**
```yaml
version: '3.4'
services:
  burni-fhir-validator-api:
    image: a5566qq123/fhir-validator-api
    container_name: burni-fhir-validator-api
    ports: 
      - "7414:7414"
    volumes: 
      - ./validationResources:/app/assets/validationResources

  burni-mongodb:
    image: mongo:4.4
    container_name: burni-mongodb
    restart: always
    volumes:
      - ./burni-mongodb:/data/db
    environment:
      - MONGO_INITDB=burni_test
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=root
      - MONGO_PORT=27017

  burni:
    image: a5566qq123/burni:main
    container_name: burni
    env_file:
      - ./burni/.env
    ports:
      - "8080:8080"
```

## Build fom source code
此範例可以在根目錄取得。

**⚠ 注意！ 您必須先將設定檔設定完成 (`.env`, `config/config.js`)。**
```yaml
version: '3.4'
services:
  fhir-burni-mongodb:
    image: mongo:4.2
    container_name : fhir-burni-mongodb
    restart: always
    ports:
      - 27017:27017
    volumes:
      - ./mongodb/db:/data/db
    environment:
      # provide your credentials here
      - MONGO_INITDB_DATABASE=admin
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=root
      - MONGO_PORT=27017
  
  fhir-burni:
    build: ./
    container_name: fhir-burni
    command: >
      /bin/sh -c '
      while ! nc -z fhir-burni-mongodb 27017;
      do
        echo "waiting for database ...";
        sleep 3;
      done;
      echo "db is ready!";
      pm2-runtime start ecosystem.config.js;
      '
    volumes :
      - ./:/nodejs/fhir-burni
      - /nodejs/fhir-burni/node_modules
      - ./validation-files:/validationResources
    ports:
      - 8080:8080
    depends_on:
      - fhir-burni-mongodb
    tty : true
    restart: on-failure:3
    stdin_open : true

  burni-fhir-validator-api:
    image: a5566qq123/fhir-validator-api
    container_name: burni-fhir-validator-api
    volumes: 
      - ./validation-files:/app/assets/validationResources
```


# Configure interaction of resources
您可以設定各個 resource 所要開放的操作 RESTful API.
檔案位置: `config/config.js`
原始檔案內容如下:
<details>
    <summary>click to show</summary>

```js
module.exports={
    "Account": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ActivityDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "AdverseEvent": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "AllergyIntolerance": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Appointment": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "AppointmentResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "AuditEvent": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Basic": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Binary": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "BiologicallyDerivedProduct": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "BodyStructure": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Bundle": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CapabilityStatement": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CarePlan": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CareTeam": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CatalogEntry": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ChargeItem": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ChargeItemDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Claim": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ClaimResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ClinicalImpression": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CodeSystem": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Communication": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CommunicationRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CompartmentDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Composition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ConceptMap": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Condition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Consent": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Contract": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Coverage": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CoverageEligibilityRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "CoverageEligibilityResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DetectedIssue": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Device": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DeviceDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DeviceMetric": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DeviceRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DeviceUseStatement": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DiagnosticReport": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DocumentManifest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "DocumentReference": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EffectEvidenceSynthesis": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Encounter": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Endpoint": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EnrollmentRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EnrollmentResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EpisodeOfCare": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EventDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Evidence": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "EvidenceVariable": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ExampleScenario": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ExplanationOfBenefit": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "FamilyMemberHistory": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Flag": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Goal": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "GraphDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Group": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "GuidanceResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "HealthcareService": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ImagingStudy": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Immunization": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ImmunizationEvaluation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ImmunizationRecommendation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ImplementationGuide": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "InsurancePlan": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Invoice": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Library": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Linkage": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "List": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Location": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Measure": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MeasureReport": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Media": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Medication": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicationAdministration": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicationDispense": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicationKnowledge": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicationRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicationStatement": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProduct": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductAuthorization": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductContraindication": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductIndication": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductIngredient": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductInteraction": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductManufactured": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductPackaged": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductPharmaceutical": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MedicinalProductUndesirableEffect": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MessageDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MessageHeader": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "MolecularSequence": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "NamingSystem": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "NutritionOrder": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Observation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ObservationDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "OperationDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "OperationOutcome": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Organization": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "OrganizationAffiliation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Parameters": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Patient": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "PaymentNotice": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "PaymentReconciliation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Person": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "PlanDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Practitioner": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "PractitionerRole": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Procedure": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Provenance": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Questionnaire": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "QuestionnaireResponse": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "RelatedPerson": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "RequestGroup": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ResearchDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ResearchElementDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ResearchStudy": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ResearchSubject": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "RiskAssessment": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "RiskEvidenceSynthesis": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Schedule": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SearchParameter": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ServiceRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Slot": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Specimen": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SpecimenDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "StructureDefinition": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "StructureMap": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Subscription": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Substance": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstanceNucleicAcid": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstancePolymer": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstanceProtein": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstanceReferenceInformation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstanceSourceMaterial": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SubstanceSpecification": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SupplyDelivery": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "SupplyRequest": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Task": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "TerminologyCapabilities": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "TestReport": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "TestScript": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "ValueSet": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "VerificationResult": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "VisionPrescription": {
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
};
```
</details>


# Configure PM2
burni 使用 pm2 啟動專案，您可以設定位於根目錄的 `ecosystem.config.js`.
原始檔案內容如下:
```js
module.exports = {
    apps: [
    {
        name: 'fhir-burni',
        script: 'server.js',
        node_args: ["--inspect"],
        watch: false,
        exec_mode: 'cluster',
        instances: 2,
        max_memory_restart: '500M',
        time: true,
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        force: true,
        wait_ready: false,
        max_restarts: 10,
        autorestart: true,
        error_file: './pm2log/err.log',
        out_file: './pm2log/out.log',
        log_file: './pm2log/log.log'
    } ,
    {
        name: 'fhir-burni-schedule-update-validation-files',
        script: 'models/FHIR/schedule-update-validation-files.js',
        node_args: ["--inspect"],
        watch: false,
        exec_mode: 'fork',
        max_memory_restart: '500M',
        force: true,
        wait_ready: false,
        max_restarts: 10,
        autorestart: true,
        error_file: 'NULL',
        out_file: 'NULL',
        log_file: 'NULL'
    }]
};
```