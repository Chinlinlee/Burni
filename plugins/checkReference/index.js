const { pluginsConfig } = require("../config");
/**
 *
 * @param {import("express").Express} app
 */
module.exports = function (app) {
    app.use("/", require("./route"));
};
