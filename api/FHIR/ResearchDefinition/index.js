const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ResearchDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchDefinition'));
}

if (_.get(config, "ResearchDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getResearchDefinitionById'));
}

if (_.get(config, "ResearchDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchDefinitionHistory'));
}

if (_.get(config, "ResearchDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getResearchDefinitionHistoryById'));
}

if (_.get(config, "ResearchDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postResearchDefinition'));
}

router.post('/([\$])validate', require('./controller/postResearchDefinitionValidate'));

if (_.get(config, "ResearchDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putResearchDefinition"));
}

if (_.get(config, "ResearchDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteResearchDefinition"));
    router.delete('/', require("./controller/condition-deleteResearchDefinition"));
}

module.exports = router;