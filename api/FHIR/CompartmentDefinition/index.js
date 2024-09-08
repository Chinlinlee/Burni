const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CompartmentDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCompartmentDefinition'));
}

if (_.get(config, "CompartmentDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getCompartmentDefinitionById'));
}

if (_.get(config, "CompartmentDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCompartmentDefinitionHistory'));
}

if (_.get(config, "CompartmentDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCompartmentDefinitionHistoryById'));
}

if (_.get(config, "CompartmentDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postCompartmentDefinition'));
}

router.post('/([\$])validate', require('./controller/postCompartmentDefinitionValidate'));

if (_.get(config, "CompartmentDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putCompartmentDefinition"));
}

if (_.get(config, "CompartmentDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCompartmentDefinition"));
    router.delete('/', require("./controller/condition-deleteCompartmentDefinition"));
}

module.exports = router;