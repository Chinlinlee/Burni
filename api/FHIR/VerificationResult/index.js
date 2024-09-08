const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "VerificationResult.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getVerificationResult'));
}

if (_.get(config, "VerificationResult.interaction.read", true)) {
    router.get('/:id', require('./controller/getVerificationResultById'));
}

if (_.get(config, "VerificationResult.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getVerificationResultHistory'));
}

if (_.get(config, "VerificationResult.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getVerificationResultHistoryById'));
}

if (_.get(config, "VerificationResult.interaction.create", true)) {
    router.post('/', require('./controller/postVerificationResult'));
}

router.post('/([\$])validate', require('./controller/postVerificationResultValidate'));

if (_.get(config, "VerificationResult.interaction.update", true)) {
    router.put('/:id', require("./controller/putVerificationResult"));
}

if (_.get(config, "VerificationResult.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteVerificationResult"));
    router.delete('/', require("./controller/condition-deleteVerificationResult"));
}

module.exports = router;