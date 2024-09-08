const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Specimen.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSpecimen'));
}

if (_.get(config, "Specimen.interaction.read", true)) {
    router.get('/:id', require('./controller/getSpecimenById'));
}

if (_.get(config, "Specimen.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSpecimenHistory'));
}

if (_.get(config, "Specimen.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSpecimenHistoryById'));
}

if (_.get(config, "Specimen.interaction.create", true)) {
    router.post('/', require('./controller/postSpecimen'));
}

router.post('/([\$])validate', require('./controller/postSpecimenValidate'));

if (_.get(config, "Specimen.interaction.update", true)) {
    router.put('/:id', require("./controller/putSpecimen"));
}

if (_.get(config, "Specimen.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSpecimen"));
    router.delete('/', require("./controller/condition-deleteSpecimen"));
}

module.exports = router;