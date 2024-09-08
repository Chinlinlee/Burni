const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SupplyRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSupplyRequest'));
}

if (_.get(config, "SupplyRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getSupplyRequestById'));
}

if (_.get(config, "SupplyRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSupplyRequestHistory'));
}

if (_.get(config, "SupplyRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSupplyRequestHistoryById'));
}

if (_.get(config, "SupplyRequest.interaction.create", true)) {
    router.post('/', require('./controller/postSupplyRequest'));
}

router.post('/([\$])validate', require('./controller/postSupplyRequestValidate'));

if (_.get(config, "SupplyRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putSupplyRequest"));
}

if (_.get(config, "SupplyRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSupplyRequest"));
    router.delete('/', require("./controller/condition-deleteSupplyRequest"));
}

module.exports = router;