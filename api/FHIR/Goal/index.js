const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Goal.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGoal'));
}

if (_.get(config, "Goal.interaction.read", true)) {
    router.get('/:id', require('./controller/getGoalById'));
}

if (_.get(config, "Goal.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGoalHistory'));
}

if (_.get(config, "Goal.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getGoalHistoryById'));
}

if (_.get(config, "Goal.interaction.create", true)) {
    router.post('/', require('./controller/postGoal'));
}

router.post('/([\$])validate', require('./controller/postGoalValidate'));

if (_.get(config, "Goal.interaction.update", true)) {
    router.put('/:id', require("./controller/putGoal"));
}

if (_.get(config, "Goal.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteGoal"));
    router.delete('/', require("./controller/condition-deleteGoal"));
}

module.exports = router;