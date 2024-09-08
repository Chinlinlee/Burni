const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DeviceRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceRequest'));
}

if (_.get(config, "DeviceRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getDeviceRequestById'));
}

if (_.get(config, "DeviceRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceRequestHistory'));
}

if (_.get(config, "DeviceRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDeviceRequestHistoryById'));
}

if (_.get(config, "DeviceRequest.interaction.create", true)) {
    router.post('/', require('./controller/postDeviceRequest'));
}

router.post('/([\$])validate', require('./controller/postDeviceRequestValidate'));

if (_.get(config, "DeviceRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putDeviceRequest"));
}

if (_.get(config, "DeviceRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDeviceRequest"));
    router.delete('/', require("./controller/condition-deleteDeviceRequest"));
}

module.exports = router;