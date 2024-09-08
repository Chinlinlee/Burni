const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "StructureDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getStructureDefinition'));
}

if (_.get(config, "StructureDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getStructureDefinitionById'));
}

if (_.get(config, "StructureDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getStructureDefinitionHistory'));
}

if (_.get(config, "StructureDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getStructureDefinitionHistoryById'));
}

if (_.get(config, "StructureDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postStructureDefinition'));
}

router.post('/([\$])validate', require('./controller/postStructureDefinitionValidate'));

if (_.get(config, "StructureDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putStructureDefinition"));
}

if (_.get(config, "StructureDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteStructureDefinition"));
    router.delete('/', require("./controller/condition-deleteStructureDefinition"));
}

module.exports = router;