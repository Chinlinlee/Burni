const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Immunization.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunization'));
}

if (_.get(config, "Immunization.interaction.read", true)) {
    router.get('/:id', require('./controller/getImmunizationById'));
}

if (_.get(config, "Immunization.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunizationHistory'));
}

if (_.get(config, "Immunization.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getImmunizationHistoryById'));
}

if (_.get(config, "Immunization.interaction.create", true)) {
    router.post('/', require('./controller/postImmunization'));
}

router.post('/([\$])validate', require('./controller/postImmunizationValidate'));

if (_.get(config, "Immunization.interaction.update", true)) {
    router.put('/:id', require("./controller/putImmunization"));
}

if (_.get(config, "Immunization.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteImmunization"));
    router.delete('/', require("./controller/condition-deleteImmunization"));
}

module.exports = router;