const path = require("path");
const appDir = path.dirname(require.main.filename);
if (!process.env.MONGODB_HOSTS) {
    require("dotenv").config({
        path: `${appDir}/.env`
    });
}

const { searchParameterRegistryReadinessStep } = require("./readinessSteps");

const modelMap = require("./connector")(process.env, {
    readinessStep: searchParameterRegistryReadinessStep
});

module.exports = modelMap;
