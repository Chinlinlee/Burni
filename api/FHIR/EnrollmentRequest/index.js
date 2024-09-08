const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EnrollmentRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEnrollmentRequest'));
}

if (_.get(config, "EnrollmentRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getEnrollmentRequestById'));
}

if (_.get(config, "EnrollmentRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEnrollmentRequestHistory'));
}

if (_.get(config, "EnrollmentRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEnrollmentRequestHistoryById'));
}

if (_.get(config, "EnrollmentRequest.interaction.create", true)) {
    router.post('/', require('./controller/postEnrollmentRequest'));
}

router.post('/([\$])validate', require('./controller/postEnrollmentRequestValidate'));

if (_.get(config, "EnrollmentRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putEnrollmentRequest"));
}

if (_.get(config, "EnrollmentRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEnrollmentRequest"));
    router.delete('/', require("./controller/condition-deleteEnrollmentRequest"));
}

module.exports = router;