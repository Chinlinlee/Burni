const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DetectedIssue.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDetectedIssue'));
}

if (_.get(config, "DetectedIssue.interaction.read", true)) {
    router.get('/:id', require('./controller/getDetectedIssueById'));
}

if (_.get(config, "DetectedIssue.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDetectedIssueHistory'));
}

if (_.get(config, "DetectedIssue.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDetectedIssueHistoryById'));
}

if (_.get(config, "DetectedIssue.interaction.create", true)) {
    router.post('/', require('./controller/postDetectedIssue'));
}

router.post('/([\$])validate', require('./controller/postDetectedIssueValidate'));

if (_.get(config, "DetectedIssue.interaction.update", true)) {
    router.put('/:id', require("./controller/putDetectedIssue"));
}

if (_.get(config, "DetectedIssue.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDetectedIssue"));
    router.delete('/', require("./controller/condition-deleteDetectedIssue"));
}

module.exports = router;