const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Condition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCondition'));
}

if (_.get(config, "Condition.interaction.read", true)) {
    router.get('/:id', require('./controller/getConditionById'));
}

if (_.get(config, "Condition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getConditionHistory'));
}

if (_.get(config, "Condition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getConditionHistoryById'));
}

if (_.get(config, "Condition.interaction.create", true)) {
    router.post('/', require('./controller/postCondition'));
}

router.post('/([\$])validate', require('./controller/postConditionValidate'));

if (_.get(config, "Condition.interaction.update", true)) {
    router.put('/:id', require("./controller/putCondition"));
}

if (_.get(config, "Condition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCondition"));
    router.delete('/', require("./controller/condition-deleteCondition"));
}

module.exports = router;