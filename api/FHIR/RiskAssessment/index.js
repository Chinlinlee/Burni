const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "RiskAssessment.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRiskAssessment'));
}

if (_.get(config, "RiskAssessment.interaction.read", true)) {
    router.get('/:id', require('./controller/getRiskAssessmentById'));
}

if (_.get(config, "RiskAssessment.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRiskAssessmentHistory'));
}

if (_.get(config, "RiskAssessment.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getRiskAssessmentHistoryById'));
}

if (_.get(config, "RiskAssessment.interaction.create", true)) {
    router.post('/', require('./controller/postRiskAssessment'));
}

router.post('/([\$])validate', require('./controller/postRiskAssessmentValidate'));

if (_.get(config, "RiskAssessment.interaction.update", true)) {
    router.put('/:id', require("./controller/putRiskAssessment"));
}

if (_.get(config, "RiskAssessment.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteRiskAssessment"));
    router.delete('/', require("./controller/condition-deleteRiskAssessment"));
}

module.exports = router;