const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "NamingSystem.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getNamingSystem'));
}

if (_.get(config, "NamingSystem.interaction.read", true)) {
    router.get('/:id', require('./controller/getNamingSystemById'));
}

if (_.get(config, "NamingSystem.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getNamingSystemHistory'));
}

if (_.get(config, "NamingSystem.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getNamingSystemHistoryById'));
}

if (_.get(config, "NamingSystem.interaction.create", true)) {
    router.post('/', require('./controller/postNamingSystem'));
}

router.post('/([\$])validate', require('./controller/postNamingSystemValidate'));

if (_.get(config, "NamingSystem.interaction.update", true)) {
    router.put('/:id', require("./controller/putNamingSystem"));
}

if (_.get(config, "NamingSystem.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteNamingSystem"));
    router.delete('/', require("./controller/condition-deleteNamingSystem"));
}

module.exports = router;