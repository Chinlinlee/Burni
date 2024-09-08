const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ChargeItem.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getChargeItem'));
}

if (_.get(config, "ChargeItem.interaction.read", true)) {
    router.get('/:id', require('./controller/getChargeItemById'));
}

if (_.get(config, "ChargeItem.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getChargeItemHistory'));
}

if (_.get(config, "ChargeItem.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getChargeItemHistoryById'));
}

if (_.get(config, "ChargeItem.interaction.create", true)) {
    router.post('/', require('./controller/postChargeItem'));
}

router.post('/([\$])validate', require('./controller/postChargeItemValidate'));

if (_.get(config, "ChargeItem.interaction.update", true)) {
    router.put('/:id', require("./controller/putChargeItem"));
}

if (_.get(config, "ChargeItem.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteChargeItem"));
    router.delete('/', require("./controller/condition-deleteChargeItem"));
}

module.exports = router;