const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SubstanceNucleicAcid.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceNucleicAcid'));
}

if (_.get(config, "SubstanceNucleicAcid.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstanceNucleicAcidById'));
}

if (_.get(config, "SubstanceNucleicAcid.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceNucleicAcidHistory'));
}

if (_.get(config, "SubstanceNucleicAcid.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstanceNucleicAcidHistoryById'));
}

if (_.get(config, "SubstanceNucleicAcid.interaction.create", true)) {
    router.post('/', require('./controller/postSubstanceNucleicAcid'));
}

router.post('/([\$])validate', require('./controller/postSubstanceNucleicAcidValidate'));

if (_.get(config, "SubstanceNucleicAcid.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstanceNucleicAcid"));
}

if (_.get(config, "SubstanceNucleicAcid.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstanceNucleicAcid"));
    router.delete('/', require("./controller/condition-deleteSubstanceNucleicAcid"));
}

module.exports = router;