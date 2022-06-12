const express = require('express');
const router = express.Router();
const path = require('path');
const _ = require("lodash");
const user = require('../api/user/service/user.service');
const tokenAuthPluginConfig = require("../../config").pluginsConfig.tokenAuth;

let adminLoginPath = _.get(tokenAuthPluginConfig.admin, "loginPath", "adminLogin");

router.get(`/${adminLoginPath}`, function(req, res) {
    res.sendFile('login.html' , {
        root: "public/html"
    });
});

router.get('/tokenIssuer', user.checkIsLoggedIn, function (req, res, next) {
    if (req.user !== tokenAuthPluginConfig.admin.username) {
        return res.status(403).send();
    }
    next();
}, function(req , res) {
    res.sendFile('tokenIssuer.html', {
        root: "public/html"
    });
});

router.get('/tokenManager', user.checkIsLoggedIn, function (req, res, next) {
    if (req.user !== tokenAuthPluginConfig.admin.username) {
        return res.status(403).send();
    }
    next();
}, function(req , res) {
    res.sendFile('tokenManager.html', {
        root: "public/html"
    });
});

module.exports = router;