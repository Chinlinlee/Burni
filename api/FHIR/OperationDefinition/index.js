const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "OperationDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOperationDefinition'));
}

if (_.get(config, "OperationDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getOperationDefinitionById'));
}

if (_.get(config, "OperationDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOperationDefinitionHistory'));
}

if (_.get(config, "OperationDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getOperationDefinitionHistoryById'));
}

if (_.get(config, "OperationDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postOperationDefinition'));
}

router.post('/([\$])validate', require('./controller/postOperationDefinitionValidate'));

if (_.get(config, "OperationDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putOperationDefinition"));
}

if (_.get(config, "OperationDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteOperationDefinition"));
    router.delete('/', require("./controller/condition-deleteOperationDefinition"));
}

module.exports = router;