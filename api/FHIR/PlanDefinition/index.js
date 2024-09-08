const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "PlanDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPlanDefinition'));
}

if (_.get(config, "PlanDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getPlanDefinitionById'));
}

if (_.get(config, "PlanDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPlanDefinitionHistory'));
}

if (_.get(config, "PlanDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPlanDefinitionHistoryById'));
}

if (_.get(config, "PlanDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postPlanDefinition'));
}

router.post('/([\$])validate', require('./controller/postPlanDefinitionValidate'));

if (_.get(config, "PlanDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putPlanDefinition"));
}

if (_.get(config, "PlanDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePlanDefinition"));
    router.delete('/', require("./controller/condition-deletePlanDefinition"));
}

module.exports = router;