const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Substance.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstance'));
}

if (_.get(config, "Substance.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstanceById'));
}

if (_.get(config, "Substance.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceHistory'));
}

if (_.get(config, "Substance.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstanceHistoryById'));
}

if (_.get(config, "Substance.interaction.create", true)) {
    router.post('/', require('./controller/postSubstance'));
}

router.post('/([\$])validate', require('./controller/postSubstanceValidate'));

if (_.get(config, "Substance.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstance"));
}

if (_.get(config, "Substance.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstance"));
    router.delete('/', require("./controller/condition-deleteSubstance"));
}

module.exports = router;