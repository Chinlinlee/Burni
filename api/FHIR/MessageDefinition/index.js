const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MessageDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMessageDefinition'));
}

if (_.get(config, "MessageDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getMessageDefinitionById'));
}

if (_.get(config, "MessageDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMessageDefinitionHistory'));
}

if (_.get(config, "MessageDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMessageDefinitionHistoryById'));
}

if (_.get(config, "MessageDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postMessageDefinition'));
}

router.post('/([\$])validate', require('./controller/postMessageDefinitionValidate'));

if (_.get(config, "MessageDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putMessageDefinition"));
}

if (_.get(config, "MessageDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMessageDefinition"));
    router.delete('/', require("./controller/condition-deleteMessageDefinition"));
}

module.exports = router;