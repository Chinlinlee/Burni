const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Practitioner.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPractitioner'));
}

if (_.get(config, "Practitioner.interaction.read", true)) {
    router.get('/:id', require('./controller/getPractitionerById'));
}

if (_.get(config, "Practitioner.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPractitionerHistory'));
}

if (_.get(config, "Practitioner.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPractitionerHistoryById'));
}

if (_.get(config, "Practitioner.interaction.create", true)) {
    router.post('/', require('./controller/postPractitioner'));
}

router.post('/([\$])validate', require('./controller/postPractitionerValidate'));

if (_.get(config, "Practitioner.interaction.update", true)) {
    router.put('/:id', require("./controller/putPractitioner"));
}

if (_.get(config, "Practitioner.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePractitioner"));
    router.delete('/', require("./controller/condition-deletePractitioner"));
}

module.exports = router;