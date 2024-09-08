const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ResearchElementDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchElementDefinition'));
}

if (_.get(config, "ResearchElementDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getResearchElementDefinitionById'));
}

if (_.get(config, "ResearchElementDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchElementDefinitionHistory'));
}

if (_.get(config, "ResearchElementDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getResearchElementDefinitionHistoryById'));
}

if (_.get(config, "ResearchElementDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postResearchElementDefinition'));
}

router.post('/([\$])validate', require('./controller/postResearchElementDefinitionValidate'));

if (_.get(config, "ResearchElementDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putResearchElementDefinition"));
}

if (_.get(config, "ResearchElementDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteResearchElementDefinition"));
    router.delete('/', require("./controller/condition-deleteResearchElementDefinition"));
}

module.exports = router;