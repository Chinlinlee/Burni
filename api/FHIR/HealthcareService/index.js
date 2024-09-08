const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "HealthcareService.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getHealthcareService'));
}

if (_.get(config, "HealthcareService.interaction.read", true)) {
    router.get('/:id', require('./controller/getHealthcareServiceById'));
}

if (_.get(config, "HealthcareService.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getHealthcareServiceHistory'));
}

if (_.get(config, "HealthcareService.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getHealthcareServiceHistoryById'));
}

if (_.get(config, "HealthcareService.interaction.create", true)) {
    router.post('/', require('./controller/postHealthcareService'));
}

router.post('/([\$])validate', require('./controller/postHealthcareServiceValidate'));

if (_.get(config, "HealthcareService.interaction.update", true)) {
    router.put('/:id', require("./controller/putHealthcareService"));
}

if (_.get(config, "HealthcareService.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteHealthcareService"));
    router.delete('/', require("./controller/condition-deleteHealthcareService"));
}

module.exports = router;