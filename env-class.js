const envVar = require("env-var");
const dotenv = require("dotenv");
dotenv.config();

module.exports.ServerEnv = {
    port: envVar.get("SERVER_PORT").required().default(8080).asPortNumber(),
    sessionSecretKey: envVar.get("SERVER_SESSION_SECRET_KEY").required().asString()
};

module.exports.MongoDbEnv = {
    dbName: envVar.get("MONGODB_NAME").required().asString(),
    hosts: envVar.get("MONGODB_HOSTS").required().asJsonArray(),
    ports: envVar.get("MONGODB_PORTS").required().asJsonArray(),
    user: envVar.get("MONGODB_USER").asString(),
    password: envVar.get("MONGODB_PASSWORD").asString(),
    authSource: envVar.get("MONGODB_AUTH_DB").default("admin").asString(),
    isShardingMode: envVar.get("MONGODB_IS_SHARDING_MODE").default("false").asBool()
};

module.exports.FhirEnv = {
    host: envVar.get("FHIRSERVER_HOST").required().asString(),
    port: envVar.get("FHIRSERVER_PORT").required().asPortNumber(),
    apiPath: envVar.get("FHIRSERVER_API_PATH").required().default("fhir").asString(),
    checkRefWhenDeletion: envVar.get("ENABLE_CHECK_REF_DELETION").default("false").asBool(),
    enableValidator: envVar.get("ENABLE_VALIDATOR").default("false").asBool()
};