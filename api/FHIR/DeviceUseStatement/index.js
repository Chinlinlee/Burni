const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DeviceUseStatement.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceUseStatement'));
}

if (_.get(config, "DeviceUseStatement.interaction.read", true)) {
    router.get('/:id', require('./controller/getDeviceUseStatementById'));
}

if (_.get(config, "DeviceUseStatement.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceUseStatementHistory'));
}

if (_.get(config, "DeviceUseStatement.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDeviceUseStatementHistoryById'));
}

if (_.get(config, "DeviceUseStatement.interaction.create", true)) {
    router.post('/', require('./controller/postDeviceUseStatement'));
}

router.post('/([\$])validate', require('./controller/postDeviceUseStatementValidate'));

if (_.get(config, "DeviceUseStatement.interaction.update", true)) {
    router.put('/:id', require("./controller/putDeviceUseStatement"));
}

if (_.get(config, "DeviceUseStatement.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDeviceUseStatement"));
    router.delete('/', require("./controller/condition-deleteDeviceUseStatement"));
}

module.exports = router;