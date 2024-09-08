const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SpecimenDefinition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSpecimenDefinition'));
}

if (_.get(config, "SpecimenDefinition.interaction.read", true)) {
    router.get('/:id', require('./controller/getSpecimenDefinitionById'));
}

if (_.get(config, "SpecimenDefinition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSpecimenDefinitionHistory'));
}

if (_.get(config, "SpecimenDefinition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSpecimenDefinitionHistoryById'));
}

if (_.get(config, "SpecimenDefinition.interaction.create", true)) {
    router.post('/', require('./controller/postSpecimenDefinition'));
}

router.post('/([\$])validate', require('./controller/postSpecimenDefinitionValidate'));

if (_.get(config, "SpecimenDefinition.interaction.update", true)) {
    router.put('/:id', require("./controller/putSpecimenDefinition"));
}

if (_.get(config, "SpecimenDefinition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSpecimenDefinition"));
    router.delete('/', require("./controller/condition-deleteSpecimenDefinition"));
}

module.exports = router;