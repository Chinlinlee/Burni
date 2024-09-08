const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "RiskEvidenceSynthesis.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRiskEvidenceSynthesis'));
}

if (_.get(config, "RiskEvidenceSynthesis.interaction.read", true)) {
    router.get('/:id', require('./controller/getRiskEvidenceSynthesisById'));
}

if (_.get(config, "RiskEvidenceSynthesis.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRiskEvidenceSynthesisHistory'));
}

if (_.get(config, "RiskEvidenceSynthesis.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getRiskEvidenceSynthesisHistoryById'));
}

if (_.get(config, "RiskEvidenceSynthesis.interaction.create", true)) {
    router.post('/', require('./controller/postRiskEvidenceSynthesis'));
}

router.post('/([\$])validate', require('./controller/postRiskEvidenceSynthesisValidate'));

if (_.get(config, "RiskEvidenceSynthesis.interaction.update", true)) {
    router.put('/:id', require("./controller/putRiskEvidenceSynthesis"));
}

if (_.get(config, "RiskEvidenceSynthesis.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteRiskEvidenceSynthesis"));
    router.delete('/', require("./controller/condition-deleteRiskEvidenceSynthesis"));
}

module.exports = router;