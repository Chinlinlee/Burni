const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Evidence.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEvidence'));
}

if (_.get(config, "Evidence.interaction.read", true)) {
    router.get('/:id', require('./controller/getEvidenceById'));
}

if (_.get(config, "Evidence.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEvidenceHistory'));
}

if (_.get(config, "Evidence.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEvidenceHistoryById'));
}

if (_.get(config, "Evidence.interaction.create", true)) {
    router.post('/', require('./controller/postEvidence'));
}

router.post('/([\$])validate', require('./controller/postEvidenceValidate'));

if (_.get(config, "Evidence.interaction.update", true)) {
    router.put('/:id', require("./controller/putEvidence"));
}

if (_.get(config, "Evidence.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEvidence"));
    router.delete('/', require("./controller/condition-deleteEvidence"));
}

module.exports = router;