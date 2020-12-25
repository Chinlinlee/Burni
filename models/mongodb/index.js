const path = require('path');
const appDir = path.dirname(require.main.filename);
if (!process.env.MONGODB_HOSTS) {
    require('dotenv').config({
        path: `${appDir}/.env`
    });
}
const dataDB = require('../mongodb/connector')(process.env);
module.exports = exports = dataDB;