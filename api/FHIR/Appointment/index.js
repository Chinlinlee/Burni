const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Appointment.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAppointment'));
}

if (_.get(config, "Appointment.interaction.read", true)) {
    router.get('/:id', require('./controller/getAppointmentById'));
}

if (_.get(config, "Appointment.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAppointmentHistory'));
}

if (_.get(config, "Appointment.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAppointmentHistoryById'));
}

if (_.get(config, "Appointment.interaction.create", true)) {
    router.post('/', require('./controller/postAppointment'));
}

router.post('/([\$])validate', require('./controller/postAppointmentValidate'));

if (_.get(config, "Appointment.interaction.update", true)) {
    router.put('/:id', require("./controller/putAppointment"));
}

if (_.get(config, "Appointment.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAppointment"));
    router.delete('/', require("./controller/condition-deleteAppointment"));
}

module.exports = router;