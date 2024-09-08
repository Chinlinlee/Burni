const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ImmunizationRecommendation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunizationRecommendation'));
}

if (_.get(config, "ImmunizationRecommendation.interaction.read", true)) {
    router.get('/:id', require('./controller/getImmunizationRecommendationById'));
}

if (_.get(config, "ImmunizationRecommendation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunizationRecommendationHistory'));
}

if (_.get(config, "ImmunizationRecommendation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getImmunizationRecommendationHistoryById'));
}

if (_.get(config, "ImmunizationRecommendation.interaction.create", true)) {
    router.post('/', require('./controller/postImmunizationRecommendation'));
}

router.post('/([\$])validate', require('./controller/postImmunizationRecommendationValidate'));

if (_.get(config, "ImmunizationRecommendation.interaction.update", true)) {
    router.put('/:id', require("./controller/putImmunizationRecommendation"));
}

if (_.get(config, "ImmunizationRecommendation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteImmunizationRecommendation"));
    router.delete('/', require("./controller/condition-deleteImmunizationRecommendation"));
}

module.exports = router;