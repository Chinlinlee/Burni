const path = require('path');
const { configure, getLogger } = require('log4js');
configure(path.join(__dirname, "../config/log4js.json"));
let burniLog = getLogger("burni");

module.exports.logger = burniLog;