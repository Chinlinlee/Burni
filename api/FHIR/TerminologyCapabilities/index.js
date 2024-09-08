const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "TerminologyCapabilities.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTerminologyCapabilities'));
}

if (_.get(config, "TerminologyCapabilities.interaction.read", true)) {
    router.get('/:id', require('./controller/getTerminologyCapabilitiesById'));
}

if (_.get(config, "TerminologyCapabilities.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTerminologyCapabilitiesHistory'));
}

if (_.get(config, "TerminologyCapabilities.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getTerminologyCapabilitiesHistoryById'));
}

if (_.get(config, "TerminologyCapabilities.interaction.create", true)) {
    router.post('/', require('./controller/postTerminologyCapabilities'));
}

router.post('/([\$])validate', require('./controller/postTerminologyCapabilitiesValidate'));

if (_.get(config, "TerminologyCapabilities.interaction.update", true)) {
    router.put('/:id', require("./controller/putTerminologyCapabilities"));
}

if (_.get(config, "TerminologyCapabilities.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteTerminologyCapabilities"));
    router.delete('/', require("./controller/condition-deleteTerminologyCapabilities"));
}

module.exports = router;