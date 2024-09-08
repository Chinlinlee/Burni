const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SupplyDelivery.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSupplyDelivery'));
}

if (_.get(config, "SupplyDelivery.interaction.read", true)) {
    router.get('/:id', require('./controller/getSupplyDeliveryById'));
}

if (_.get(config, "SupplyDelivery.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSupplyDeliveryHistory'));
}

if (_.get(config, "SupplyDelivery.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSupplyDeliveryHistoryById'));
}

if (_.get(config, "SupplyDelivery.interaction.create", true)) {
    router.post('/', require('./controller/postSupplyDelivery'));
}

router.post('/([\$])validate', require('./controller/postSupplyDeliveryValidate'));

if (_.get(config, "SupplyDelivery.interaction.update", true)) {
    router.put('/:id', require("./controller/putSupplyDelivery"));
}

if (_.get(config, "SupplyDelivery.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSupplyDelivery"));
    router.delete('/', require("./controller/condition-deleteSupplyDelivery"));
}

module.exports = router;