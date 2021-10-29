const fs = require('fs');
//const { generateAPI , generateMetaData } =require('../API_Generator');
const { generateAPI , generateMetaData, generateConfig } =require('../API_Generator_V2');
const { genHistoryModel } = require('../history_model_Generator');
const config  = require('../config/config');

function init () {
    if (!fs.existsSync(".env")) {
        let envText = `
MONGODB_NAME="dbName"
MONGODB_HOSTS=["mongodb"]
MONGODB_PORTS=[27017]
MONGODB_USER="user"
MONGODB_PASSWORD="password"
MONGODB_SLAVEMODE=false

SERVER_PORT=8080

FHIRSERVER_HOST="localhost"
FHIRSERVER_PORT=8080
FHIRSERVER_APIPATH="fhir"

ENABLE_TOKEN_AUTH=false
JWT_SECRET_KEY="secret-key"
ADMIN_LOGIN_PATH="adminLogin"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password"

ENABLE_CHECK_ALL_RESOURCE_ID=false
`;
        fs.writeFileSync(".env" , envText);
        console.log("Please config dotenv file first, the example dotenv file generated in root path");
        process.exit(0);
    }
    generateAPI(config);
    generateMetaData();
    generateConfig();
    genHistoryModel();
    console.log("Init finished");
    process.exit(0);
}
init();