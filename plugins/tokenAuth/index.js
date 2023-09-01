const { pluginsConfig } = require("../config");
const tokenAuthPluginConfig = pluginsConfig.tokenAuth;
const passport = require("passport");

/**
 *
 * @param {import("express").Express} app
 */
module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    if (
        !tokenAuthPluginConfig.admin.username ||
        !tokenAuthPluginConfig.admin.password
    ) {
        console.error(
            "please set admin username and password in plugin config file"
        );
        process.exit(1);
    }
    app.use("/", require("./web"));
    app.use("/user", require("./api/user"));
    app.use("/", require("./route"));

    require("./api/user/service/passport");

    require("./models/issuedToken");
};
