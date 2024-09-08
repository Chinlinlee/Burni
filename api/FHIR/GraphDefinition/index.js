const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "GraphDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGraphDefinition'));
}

if (_.get(config, "GraphDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getGraphDefinitionById'));
}

if (_.get(config, "GraphDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGraphDefinitionHistory'));
}

if (_.get(config, "GraphDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getGraphDefinitionHistoryById'));
}

if (_.get(config, "GraphDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postGraphDefinition'));
}

router.post('/([\$])validate', require('./controller/postGraphDefinitionValidate'));

if (_.get(config, "GraphDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putGraphDefinition"));
}

if (_.get(config, "GraphDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteGraphDefinition"));
    router.delete('/', require("./controller/condition-deleteGraphDefinition"));
}

module.exports = router;