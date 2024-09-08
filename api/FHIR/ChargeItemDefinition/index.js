const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ChargeItemDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getChargeItemDefinition'));
}

if (_.get(config, "ChargeItemDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getChargeItemDefinitionById'));
}

if (_.get(config, "ChargeItemDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getChargeItemDefinitionHistory'));
}

if (_.get(config, "ChargeItemDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getChargeItemDefinitionHistoryById'));
}

if (_.get(config, "ChargeItemDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postChargeItemDefinition'));
}

router.post('/([\$])validate', require('./controller/postChargeItemDefinitionValidate'));

if (_.get(config, "ChargeItemDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putChargeItemDefinition"));
}

if (_.get(config, "ChargeItemDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteChargeItemDefinition"));
    router.delete('/', require("./controller/condition-deleteChargeItemDefinition"));
}

module.exports = router;