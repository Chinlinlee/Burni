const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Encounter.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEncounter'));
}

if (_.get(config, "Encounter.interaction.read", true)) {
    router.get('/:id', require('./controller/getEncounterById'));
}

if (_.get(config, "Encounter.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEncounterHistory'));
}

if (_.get(config, "Encounter.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEncounterHistoryById'));
}

if (_.get(config, "Encounter.interaction.create", true)) {
    router.post('/', require('./controller/postEncounter'));
}

router.post('/([\$])validate', require('./controller/postEncounterValidate'));

if (_.get(config, "Encounter.interaction.update", true)) {
    router.put('/:id', require("./controller/putEncounter"));
}

if (_.get(config, "Encounter.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEncounter"));
    router.delete('/', require("./controller/condition-deleteEncounter"));
}

module.exports = router;