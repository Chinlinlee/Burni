const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CarePlan.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCarePlan'));
}

if (_.get(config, "CarePlan.interaction.read", true)) {
    router.get('/:id', require('./controller/getCarePlanById'));
}

if (_.get(config, "CarePlan.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCarePlanHistory'));
}

if (_.get(config, "CarePlan.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCarePlanHistoryById'));
}

if (_.get(config, "CarePlan.interaction.create", true)) {
    router.post('/', require('./controller/postCarePlan'));
}

router.post('/([\$])validate', require('./controller/postCarePlanValidate'));

if (_.get(config, "CarePlan.interaction.update", true)) {
    router.put('/:id', require("./controller/putCarePlan"));
}

if (_.get(config, "CarePlan.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCarePlan"));
    router.delete('/', require("./controller/condition-deleteCarePlan"));
}

module.exports = router;