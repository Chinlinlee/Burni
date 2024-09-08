const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CapabilityStatement.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCapabilityStatement'));
}

if (_.get(config, "CapabilityStatement.interaction.read", true)) {
    router.get('/:id', require('./controller/getCapabilityStatementById'));
}

if (_.get(config, "CapabilityStatement.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCapabilityStatementHistory'));
}

if (_.get(config, "CapabilityStatement.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCapabilityStatementHistoryById'));
}

if (_.get(config, "CapabilityStatement.interaction.create", true)) {
    router.post('/', require('./controller/postCapabilityStatement'));
}

router.post('/([\$])validate', require('./controller/postCapabilityStatementValidate'));

if (_.get(config, "CapabilityStatement.interaction.update", true)) {
    router.put('/:id', require("./controller/putCapabilityStatement"));
}

if (_.get(config, "CapabilityStatement.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCapabilityStatement"));
    router.delete('/', require("./controller/condition-deleteCapabilityStatement"));
}

module.exports = router;