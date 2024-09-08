const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "RelatedPerson.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRelatedPerson'));
}

if (_.get(config, "RelatedPerson.interaction.read", true)) {
    router.get('/:id', require('./controller/getRelatedPersonById'));
}

if (_.get(config, "RelatedPerson.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRelatedPersonHistory'));
}

if (_.get(config, "RelatedPerson.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getRelatedPersonHistoryById'));
}

if (_.get(config, "RelatedPerson.interaction.create", true)) {
    router.post('/', require('./controller/postRelatedPerson'));
}

router.post('/([\$])validate', require('./controller/postRelatedPersonValidate'));

if (_.get(config, "RelatedPerson.interaction.update", true)) {
    router.put('/:id', require("./controller/putRelatedPerson"));
}

if (_.get(config, "RelatedPerson.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteRelatedPerson"));
    router.delete('/', require("./controller/condition-deleteRelatedPerson"));
}

module.exports = router;