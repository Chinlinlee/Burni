const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ImmunizationEvaluation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunizationEvaluation'));
}

if (_.get(config, "ImmunizationEvaluation.interaction.read", true)) {
    router.get('/:id', require('./controller/getImmunizationEvaluationById'));
}

if (_.get(config, "ImmunizationEvaluation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImmunizationEvaluationHistory'));
}

if (_.get(config, "ImmunizationEvaluation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getImmunizationEvaluationHistoryById'));
}

if (_.get(config, "ImmunizationEvaluation.interaction.create", true)) {
    router.post('/', require('./controller/postImmunizationEvaluation'));
}

router.post('/([\$])validate', require('./controller/postImmunizationEvaluationValidate'));

if (_.get(config, "ImmunizationEvaluation.interaction.update", true)) {
    router.put('/:id', require("./controller/putImmunizationEvaluation"));
}

if (_.get(config, "ImmunizationEvaluation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteImmunizationEvaluation"));
    router.delete('/', require("./controller/condition-deleteImmunizationEvaluation"));
}

module.exports = router;