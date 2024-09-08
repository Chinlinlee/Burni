const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SubstancePolymer.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstancePolymer'));
}

if (_.get(config, "SubstancePolymer.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstancePolymerById'));
}

if (_.get(config, "SubstancePolymer.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstancePolymerHistory'));
}

if (_.get(config, "SubstancePolymer.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstancePolymerHistoryById'));
}

if (_.get(config, "SubstancePolymer.interaction.create", true)) {
    router.post('/', require('./controller/postSubstancePolymer'));
}

router.post('/([\$])validate', require('./controller/postSubstancePolymerValidate'));

if (_.get(config, "SubstancePolymer.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstancePolymer"));
}

if (_.get(config, "SubstancePolymer.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstancePolymer"));
    router.delete('/', require("./controller/condition-deleteSubstancePolymer"));
}

module.exports = router;