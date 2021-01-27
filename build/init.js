const fs = require('fs');
const { generateAPI , generateMetaData } =require('../API_Generator');
const config  = require('./config');

function init () {
    if (!fs.existsSync(".env")) {
        let envText = `
MONGODB_NAME="dbName"
MONGODB_HOSTS=["mongodb"]
MONGODB_PORTS=[27017]
MONGODB_USER="user"
MONGODB_PASSWORD="password"
MONGODB_SLAVEMODE=false


FHIRSERVER_HOST="localhost"
FHIRSERVER_PORT=8088
FHIRSERVER_APIPATH="fhir"
`;
        fs.writeFileSync(".env" , envText);
    }
    generateAPI(config);
    generateMetaData();
}
init();