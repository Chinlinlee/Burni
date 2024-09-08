const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ExampleScenario.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getExampleScenario'));
}

if (_.get(config, "ExampleScenario.interaction.read", true)) {
    router.get('/:id', require('./controller/getExampleScenarioById'));
}

if (_.get(config, "ExampleScenario.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getExampleScenarioHistory'));
}

if (_.get(config, "ExampleScenario.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getExampleScenarioHistoryById'));
}

if (_.get(config, "ExampleScenario.interaction.create", true)) {
    router.post('/', require('./controller/postExampleScenario'));
}

router.post('/([\$])validate', require('./controller/postExampleScenarioValidate'));

if (_.get(config, "ExampleScenario.interaction.update", true)) {
    router.put('/:id', require("./controller/putExampleScenario"));
}

if (_.get(config, "ExampleScenario.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteExampleScenario"));
    router.delete('/', require("./controller/condition-deleteExampleScenario"));
}

module.exports = router;