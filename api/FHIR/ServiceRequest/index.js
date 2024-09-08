const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ServiceRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getServiceRequest'));
}

if (_.get(config, "ServiceRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getServiceRequestById'));
}

if (_.get(config, "ServiceRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getServiceRequestHistory'));
}

if (_.get(config, "ServiceRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getServiceRequestHistoryById'));
}

if (_.get(config, "ServiceRequest.interaction.create", true)) {
    router.post('/', require('./controller/postServiceRequest'));
}

router.post('/([\$])validate', require('./controller/postServiceRequestValidate'));

if (_.get(config, "ServiceRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putServiceRequest"));
}

if (_.get(config, "ServiceRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteServiceRequest"));
    router.delete('/', require("./controller/condition-deleteServiceRequest"));
}

module.exports = router;