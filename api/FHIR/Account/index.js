const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Account.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAccount'));
}

if (_.get(config, "Account.interaction.read", true)) {
    router.get('/:id', require('./controller/getAccountById'));
}

if (_.get(config, "Account.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAccountHistory'));
}

if (_.get(config, "Account.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAccountHistoryById'));
}

if (_.get(config, "Account.interaction.create", true)) {
    router.post('/', require('./controller/postAccount'));
}

router.post('/([\$])validate', require('./controller/postAccountValidate'));

if (_.get(config, "Account.interaction.update", true)) {
    router.put('/:id', require("./controller/putAccount"));
}

if (_.get(config, "Account.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAccount"));
    router.delete('/', require("./controller/condition-deleteAccount"));
}

module.exports = router;