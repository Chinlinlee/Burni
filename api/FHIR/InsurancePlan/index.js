const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "InsurancePlan.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getInsurancePlan'));
}

if (_.get(config, "InsurancePlan.interaction.read", true)) {
    router.get('/:id', require('./controller/getInsurancePlanById'));
}

if (_.get(config, "InsurancePlan.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getInsurancePlanHistory'));
}

if (_.get(config, "InsurancePlan.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getInsurancePlanHistoryById'));
}

if (_.get(config, "InsurancePlan.interaction.create", true)) {
    router.post('/', require('./controller/postInsurancePlan'));
}

router.post('/([\$])validate', require('./controller/postInsurancePlanValidate'));

if (_.get(config, "InsurancePlan.interaction.update", true)) {
    router.put('/:id', require("./controller/putInsurancePlan"));
}

if (_.get(config, "InsurancePlan.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteInsurancePlan"));
    router.delete('/', require("./controller/condition-deleteInsurancePlan"));
}

module.exports = router;