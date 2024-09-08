const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Schedule.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSchedule'));
}

if (_.get(config, "Schedule.interaction.read", true)) {
    router.get('/:id', require('./controller/getScheduleById'));
}

if (_.get(config, "Schedule.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getScheduleHistory'));
}

if (_.get(config, "Schedule.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getScheduleHistoryById'));
}

if (_.get(config, "Schedule.interaction.create", true)) {
    router.post('/', require('./controller/postSchedule'));
}

router.post('/([\$])validate', require('./controller/postScheduleValidate'));

if (_.get(config, "Schedule.interaction.update", true)) {
    router.put('/:id', require("./controller/putSchedule"));
}

if (_.get(config, "Schedule.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSchedule"));
    router.delete('/', require("./controller/condition-deleteSchedule"));
}

module.exports = router;