const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Endpoint.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEndpoint'));
}

if (_.get(config, "Endpoint.interaction.read", true)) {
    router.get('/:id', require('./controller/getEndpointById'));
}

if (_.get(config, "Endpoint.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEndpointHistory'));
}

if (_.get(config, "Endpoint.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEndpointHistoryById'));
}

if (_.get(config, "Endpoint.interaction.create", true)) {
    router.post('/', require('./controller/postEndpoint'));
}

router.post('/([\$])validate', require('./controller/postEndpointValidate'));

if (_.get(config, "Endpoint.interaction.update", true)) {
    router.put('/:id', require("./controller/putEndpoint"));
}

if (_.get(config, "Endpoint.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEndpoint"));
    router.delete('/', require("./controller/condition-deleteEndpoint"));
}

module.exports = router;