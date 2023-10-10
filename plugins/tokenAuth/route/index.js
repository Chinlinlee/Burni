const router = require("express").Router();
const { pluginsConfig } = require("../../config");
const _ = require("lodash");
const { hasPermission } = require("../middleware/checkToken");

const tokenAuthPlugin = pluginsConfig.tokenAuth;

for (let i = 0; i < tokenAuthPlugin.routers.length; i++) {
    let middlewareRouter = tokenAuthPlugin.routers[i];
    router[middlewareRouter.method](middlewareRouter.path, hasPermission);
}

module.exports = router;
