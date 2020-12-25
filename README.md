# Simple-Express-FHIR-Server


The simple node-ExpressJS FHIR server implement.
This server supported FHIR RESTFul API below:
- read (e.g. GET http://example.com/fhir/Patient/example)
- update (e.g. PUT http://example.com/fhir/Patient/example)
- delete (e.g. DELETE http://example.com/fhir/Patient/example)
- search (e.g. http://example.com/fhir/Patient?_id=example)

**The search API now only suppurt _id & empty parameter**
<font color=red>**Don't remove Bundle.js in models/mongodb/FHIRTypeSchema**</font>

## Installation
```bash=
npm install
npm build #This will generate example dotenv file and API files that you setting in config.js
```

## configure

The resources config in `build\config.js`
```javascript=
module.exports = {
    resources : [
        "Patient"  // add the resource name that you need
    ]
}
```
dotenv in root path `.env`
```=
MONGODB_NAME="dbName"
MONGODB_HOSTS=["mongodb"]
MONGODB_PORTS=[27017]
MONGODB_USER="myAdmin"
MONGODB_PASSWORD="MymongoAdmin1"
MONGODB_SLAVEMODE=false

FHIRSERVER_HOST="localhost"
FHIRSERVER_PORT=8088
FHIRSERVER_APIPATH="fhir"
```

## Usage
```
node server.js
```


## TODO
- [ ] metadata
- [ ] history