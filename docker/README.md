# burni docker

# Environments

| Variable Name                | Data Type      | Description                                                                                               |
|:----------------------------:|:--------------:|:---------------------------------------------------------------------------------------------------------:|
| MONGODB_NAME                 | String         | Database name of MongoDB                                                                                  |
| MONGODB_HOSTS                | Array <String> | Connection hosts name, e.g. ["127.0.0.1"]、["localhost"]                                                   |
| MONGODB_PORTS                | Array<Number>  | The ports corresponding to the order of MONGODB_HOSTS, e.g. [27017]                                       |
| MONGODB_USER                 | String         | Username of MongoDB                                                                                       |
| MONGODB_PASSWORD             | String         | Password of username of MongoDB                                                                           |
| SERVER_PORT                  | Number         | Port of server listening                                                                                  |
| FHIRSERVER_HOST              | String         | The hostname use in bundle URL                                                                            |
| FHIRSERVER_PORT              | Number         | The port use in bundle URL                                                                                |
| FHIRSERVER_APIPATH           | String         | The FHIR API path e.g. "api/fhir" is http://xxx.com/api/fhir/Patient                                      |
| ENABLE_TOKEN_AUTH            | Boolean        | whether enable token authentication                                                                       |
| JWT_SECRET_KEY               | String         | Secret key of JWT                                                                                         |
| ADMIN_LOGIN_PATH             | String         | URL path for login page of issuing token, e.g. adminLogin => http://localhost/adminLogin                  |
| ADMIN_USERNAME               | String         | Administration username for login page of issuing token                                                   |
| ADMIN_PASSWORD               | String         | Password of administration user for login page of issuing token                                           |
| ENABLE_CHECK_ALL_RESOURCE_ID | Boolean        | Unique ID of resources of crossing whole system, e.g. Patient/123 and Organization/123 is invalid         |
| ENABLE_CHECK_REFERENCE       | Boolean        | Validate reference in resource is exists                                                                  |
| ENABLE_CSHARP_VALIDATOR      | Boolean        | whether enable Csharp validator, use in $validate API                                                     |
| VALIDATION_FILES_ROOT_PATH   | String         | The path store `Structure Definition`, `Code System`, `Value Set` resource file, use for csharp validator |
| VALIDATION_API_URL           | String         | API URL of Csharp validator                                                                               |

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
**⚠ Notice, you need to do the configuration first (`.env`, `config/config.js`).**
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
The example from root path.

**⚠ Notice, you need to do the configuration first (`.env`, `config/config.js`).**
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
You can configure the interaction with `config/config.js` file.
The original configuration in docker below:
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
burni use pm2 to run.
You can configure the `ecosystem.config.js` in root directory.
The original configuration in docker below:
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