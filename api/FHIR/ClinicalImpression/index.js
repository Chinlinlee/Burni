const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ClinicalImpression.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClinicalImpression'));
}

if (_.get(config, "ClinicalImpression.interaction.read", true)) {
    router.get('/:id', require('./controller/getClinicalImpressionById'));
}

if (_.get(config, "ClinicalImpression.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClinicalImpressionHistory'));
}

if (_.get(config, "ClinicalImpression.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getClinicalImpressionHistoryById'));
}

if (_.get(config, "ClinicalImpression.interaction.create", true)) {
    router.post('/', require('./controller/postClinicalImpression'));
}

router.post('/([\$])validate', require('./controller/postClinicalImpressionValidate'));

if (_.get(config, "ClinicalImpression.interaction.update", true)) {
    router.put('/:id', require("./controller/putClinicalImpression"));
}

if (_.get(config, "ClinicalImpression.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteClinicalImpression"));
    router.delete('/', require("./controller/condition-deleteClinicalImpression"));
}

module.exports = router;