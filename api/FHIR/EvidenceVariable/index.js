const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EvidenceVariable.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEvidenceVariable'));
}

if (_.get(config, "EvidenceVariable.interaction.read", true)) {
    router.get('/:id', require('./controller/getEvidenceVariableById'));
}

if (_.get(config, "EvidenceVariable.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEvidenceVariableHistory'));
}

if (_.get(config, "EvidenceVariable.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEvidenceVariableHistoryById'));
}

if (_.get(config, "EvidenceVariable.interaction.create", true)) {
    router.post('/', require('./controller/postEvidenceVariable'));
}

router.post('/([\$])validate', require('./controller/postEvidenceVariableValidate'));

if (_.get(config, "EvidenceVariable.interaction.update", true)) {
    router.put('/:id', require("./controller/putEvidenceVariable"));
}

if (_.get(config, "EvidenceVariable.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEvidenceVariable"));
    router.delete('/', require("./controller/condition-deleteEvidenceVariable"));
}

module.exports = router;