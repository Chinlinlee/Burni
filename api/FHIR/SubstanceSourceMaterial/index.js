const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SubstanceSourceMaterial.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceSourceMaterial'));
}

if (_.get(config, "SubstanceSourceMaterial.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstanceSourceMaterialById'));
}

if (_.get(config, "SubstanceSourceMaterial.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceSourceMaterialHistory'));
}

if (_.get(config, "SubstanceSourceMaterial.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstanceSourceMaterialHistoryById'));
}

if (_.get(config, "SubstanceSourceMaterial.interaction.create", true)) {
    router.post('/', require('./controller/postSubstanceSourceMaterial'));
}

router.post('/([\$])validate', require('./controller/postSubstanceSourceMaterialValidate'));

if (_.get(config, "SubstanceSourceMaterial.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstanceSourceMaterial"));
}

if (_.get(config, "SubstanceSourceMaterial.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstanceSourceMaterial"));
    router.delete('/', require("./controller/condition-deleteSubstanceSourceMaterial"));
}

module.exports = router;