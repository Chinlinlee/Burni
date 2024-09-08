const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EventDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEventDefinition'));
}

if (_.get(config, "EventDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getEventDefinitionById'));
}

if (_.get(config, "EventDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEventDefinitionHistory'));
}

if (_.get(config, "EventDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEventDefinitionHistoryById'));
}

if (_.get(config, "EventDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postEventDefinition'));
}

router.post('/([\$])validate', require('./controller/postEventDefinitionValidate'));

if (_.get(config, "EventDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putEventDefinition"));
}

if (_.get(config, "EventDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEventDefinition"));
    router.delete('/', require("./controller/condition-deleteEventDefinition"));
}

module.exports = router;