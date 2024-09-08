const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ObservationDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getObservationDefinition'));
}

if (_.get(config, "ObservationDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getObservationDefinitionById'));
}

if (_.get(config, "ObservationDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getObservationDefinitionHistory'));
}

if (_.get(config, "ObservationDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getObservationDefinitionHistoryById'));
}

if (_.get(config, "ObservationDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postObservationDefinition'));
}

router.post('/([\$])validate', require('./controller/postObservationDefinitionValidate'));

if (_.get(config, "ObservationDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putObservationDefinition"));
}

if (_.get(config, "ObservationDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteObservationDefinition"));
    router.delete('/', require("./controller/condition-deleteObservationDefinition"));
}

module.exports = router;