const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EnrollmentResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEnrollmentResponse'));
}

if (_.get(config, "EnrollmentResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getEnrollmentResponseById'));
}

if (_.get(config, "EnrollmentResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEnrollmentResponseHistory'));
}

if (_.get(config, "EnrollmentResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEnrollmentResponseHistoryById'));
}

if (_.get(config, "EnrollmentResponse.interaction.create", true)) {
    router.post('/', require('./controller/postEnrollmentResponse'));
}

router.post('/([\$])validate', require('./controller/postEnrollmentResponseValidate'));

if (_.get(config, "EnrollmentResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putEnrollmentResponse"));
}

if (_.get(config, "EnrollmentResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEnrollmentResponse"));
    router.delete('/', require("./controller/condition-deleteEnrollmentResponse"));
}

module.exports = router;