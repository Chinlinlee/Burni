const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DeviceMetric.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceMetric'));
}

if (_.get(config, "DeviceMetric.interaction.read", true)) {
    router.get('/:id', require('./controller/getDeviceMetricById'));
}

if (_.get(config, "DeviceMetric.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceMetricHistory'));
}

if (_.get(config, "DeviceMetric.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDeviceMetricHistoryById'));
}

if (_.get(config, "DeviceMetric.interaction.create", true)) {
    router.post('/', require('./controller/postDeviceMetric'));
}

router.post('/([\$])validate', require('./controller/postDeviceMetricValidate'));

if (_.get(config, "DeviceMetric.interaction.update", true)) {
    router.put('/:id', require("./controller/putDeviceMetric"));
}

if (_.get(config, "DeviceMetric.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDeviceMetric"));
    router.delete('/', require("./controller/condition-deleteDeviceMetric"));
}

module.exports = router;