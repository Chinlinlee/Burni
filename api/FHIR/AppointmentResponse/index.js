const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "AppointmentResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAppointmentResponse'));
}

if (_.get(config, "AppointmentResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getAppointmentResponseById'));
}

if (_.get(config, "AppointmentResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAppointmentResponseHistory'));
}

if (_.get(config, "AppointmentResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAppointmentResponseHistoryById'));
}

if (_.get(config, "AppointmentResponse.interaction.create", true)) {
    router.post('/', require('./controller/postAppointmentResponse'));
}

router.post('/([\$])validate', require('./controller/postAppointmentResponseValidate'));

if (_.get(config, "AppointmentResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putAppointmentResponse"));
}

if (_.get(config, "AppointmentResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAppointmentResponse"));
    router.delete('/', require("./controller/condition-deleteAppointmentResponse"));
}

module.exports = router;