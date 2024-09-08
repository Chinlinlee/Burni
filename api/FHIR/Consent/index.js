const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Consent.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getConsent'));
}

if (_.get(config, "Consent.interaction.read", true)) {
    router.get('/:id', require('./controller/getConsentById'));
}

if (_.get(config, "Consent.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getConsentHistory'));
}

if (_.get(config, "Consent.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getConsentHistoryById'));
}

if (_.get(config, "Consent.interaction.create", true)) {
    router.post('/', require('./controller/postConsent'));
}

router.post('/([\$])validate', require('./controller/postConsentValidate'));

if (_.get(config, "Consent.interaction.update", true)) {
    router.put('/:id', require("./controller/putConsent"));
}

if (_.get(config, "Consent.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteConsent"));
    router.delete('/', require("./controller/condition-deleteConsent"));
}

module.exports = router;