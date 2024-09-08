const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "NutritionOrder.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getNutritionOrder'));
}

if (_.get(config, "NutritionOrder.interaction.read", true)) {
    router.get('/:id', require('./controller/getNutritionOrderById'));
}

if (_.get(config, "NutritionOrder.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getNutritionOrderHistory'));
}

if (_.get(config, "NutritionOrder.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getNutritionOrderHistoryById'));
}

if (_.get(config, "NutritionOrder.interaction.create", true)) {
    router.post('/', require('./controller/postNutritionOrder'));
}

router.post('/([\$])validate', require('./controller/postNutritionOrderValidate'));

if (_.get(config, "NutritionOrder.interaction.update", true)) {
    router.put('/:id', require("./controller/putNutritionOrder"));
}

if (_.get(config, "NutritionOrder.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteNutritionOrder"));
    router.delete('/', require("./controller/condition-deleteNutritionOrder"));
}

module.exports = router;