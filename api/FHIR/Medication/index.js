const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Medication.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedication'));
}

if (_.get(config, "Medication.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationById'));
}

if (_.get(config, "Medication.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationHistory'));
}

if (_.get(config, "Medication.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationHistoryById'));
}

if (_.get(config, "Medication.interaction.create", true)) {
    router.post('/', require('./controller/postMedication'));
}

router.post('/([\$])validate', require('./controller/postMedicationValidate'));

if (_.get(config, "Medication.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedication"));
}

if (_.get(config, "Medication.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedication"));
    router.delete('/', require("./controller/condition-deleteMedication"));
}

module.exports = router;