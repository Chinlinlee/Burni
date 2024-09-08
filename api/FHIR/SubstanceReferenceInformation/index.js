const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SubstanceReferenceInformation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceReferenceInformation'));
}

if (_.get(config, "SubstanceReferenceInformation.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstanceReferenceInformationById'));
}

if (_.get(config, "SubstanceReferenceInformation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceReferenceInformationHistory'));
}

if (_.get(config, "SubstanceReferenceInformation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstanceReferenceInformationHistoryById'));
}

if (_.get(config, "SubstanceReferenceInformation.interaction.create", true)) {
    router.post('/', require('./controller/postSubstanceReferenceInformation'));
}

router.post('/([\$])validate', require('./controller/postSubstanceReferenceInformationValidate'));

if (_.get(config, "SubstanceReferenceInformation.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstanceReferenceInformation"));
}

if (_.get(config, "SubstanceReferenceInformation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstanceReferenceInformation"));
    router.delete('/', require("./controller/condition-deleteSubstanceReferenceInformation"));
}

module.exports = router;