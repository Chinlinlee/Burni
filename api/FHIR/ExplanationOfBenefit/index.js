const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ExplanationOfBenefit.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getExplanationOfBenefit'));
}

if (_.get(config, "ExplanationOfBenefit.interaction.read", true)) {
    router.get('/:id', require('./controller/getExplanationOfBenefitById'));
}

if (_.get(config, "ExplanationOfBenefit.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getExplanationOfBenefitHistory'));
}

if (_.get(config, "ExplanationOfBenefit.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getExplanationOfBenefitHistoryById'));
}

if (_.get(config, "ExplanationOfBenefit.interaction.create", true)) {
    router.post('/', require('./controller/postExplanationOfBenefit'));
}

router.post('/([\$])validate', require('./controller/postExplanationOfBenefitValidate'));

if (_.get(config, "ExplanationOfBenefit.interaction.update", true)) {
    router.put('/:id', require("./controller/putExplanationOfBenefit"));
}

if (_.get(config, "ExplanationOfBenefit.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteExplanationOfBenefit"));
    router.delete('/', require("./controller/condition-deleteExplanationOfBenefit"));
}

module.exports = router;