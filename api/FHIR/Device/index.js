const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Device.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDevice'));
}

if (_.get(config, "Device.interaction.read", true)) {
    router.get('/:id', require('./controller/getDeviceById'));
}

if (_.get(config, "Device.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceHistory'));
}

if (_.get(config, "Device.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDeviceHistoryById'));
}

if (_.get(config, "Device.interaction.create", true)) {
    router.post('/', require('./controller/postDevice'));
}

router.post('/([\$])validate', require('./controller/postDeviceValidate'));

if (_.get(config, "Device.interaction.update", true)) {
    router.put('/:id', require("./controller/putDevice"));
}

if (_.get(config, "Device.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDevice"));
    router.delete('/', require("./controller/condition-deleteDevice"));
}

module.exports = router;