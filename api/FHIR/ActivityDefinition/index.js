const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ActivityDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getActivityDefinition'));
}

if (_.get(config, "ActivityDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getActivityDefinitionById'));
}

if (_.get(config, "ActivityDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getActivityDefinitionHistory'));
}

if (_.get(config, "ActivityDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getActivityDefinitionHistoryById'));
}

if (_.get(config, "ActivityDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postActivityDefinition'));
}

router.post('/([\$])validate', require('./controller/postActivityDefinitionValidate'));

if (_.get(config, "ActivityDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putActivityDefinition"));
}

if (_.get(config, "ActivityDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteActivityDefinition"));
    router.delete('/', require("./controller/condition-deleteActivityDefinition"));
}

module.exports = router;