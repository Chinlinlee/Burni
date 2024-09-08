const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "OperationOutcome.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOperationOutcome'));
}

if (_.get(config, "OperationOutcome.interaction.read", true)) {
    router.get('/:id', require('./controller/getOperationOutcomeById'));
}

if (_.get(config, "OperationOutcome.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOperationOutcomeHistory'));
}

if (_.get(config, "OperationOutcome.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getOperationOutcomeHistoryById'));
}

if (_.get(config, "OperationOutcome.interaction.create", true)) {
    router.post('/', require('./controller/postOperationOutcome'));
}

router.post('/([\$])validate', require('./controller/postOperationOutcomeValidate'));

if (_.get(config, "OperationOutcome.interaction.update", true)) {
    router.put('/:id', require("./controller/putOperationOutcome"));
}

if (_.get(config, "OperationOutcome.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteOperationOutcome"));
    router.delete('/', require("./controller/condition-deleteOperationOutcome"));
}

module.exports = router;