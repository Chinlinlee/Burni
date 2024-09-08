const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Observation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getObservation'));
}

if (_.get(config, "Observation.interaction.read", true)) {
    router.get('/:id', require('./controller/getObservationById'));
}

if (_.get(config, "Observation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getObservationHistory'));
}

if (_.get(config, "Observation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getObservationHistoryById'));
}

if (_.get(config, "Observation.interaction.create", true)) {
    router.post('/', require('./controller/postObservation'));
}

router.post('/([\$])validate', require('./controller/postObservationValidate'));

if (_.get(config, "Observation.interaction.update", true)) {
    router.put('/:id', require("./controller/putObservation"));
}

if (_.get(config, "Observation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteObservation"));
    router.delete('/', require("./controller/condition-deleteObservation"));
}

module.exports = router;