const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DeviceDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceDefinition'));
}

if (_.get(config, "DeviceDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getDeviceDefinitionById'));
}

if (_.get(config, "DeviceDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDeviceDefinitionHistory'));
}

if (_.get(config, "DeviceDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDeviceDefinitionHistoryById'));
}

if (_.get(config, "DeviceDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postDeviceDefinition'));
}

router.post('/([\$])validate', require('./controller/postDeviceDefinitionValidate'));

if (_.get(config, "DeviceDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putDeviceDefinition"));
}

if (_.get(config, "DeviceDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDeviceDefinition"));
    router.delete('/', require("./controller/condition-deleteDeviceDefinition"));
}

module.exports = router;