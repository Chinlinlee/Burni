const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicationAdministration.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationAdministration'));
}

if (_.get(config, "MedicationAdministration.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationAdministrationById'));
}

if (_.get(config, "MedicationAdministration.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationAdministrationHistory'));
}

if (_.get(config, "MedicationAdministration.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationAdministrationHistoryById'));
}

if (_.get(config, "MedicationAdministration.interaction.create", true)) {
    router.post('/', require('./controller/postMedicationAdministration'));
}

router.post('/([\$])validate', require('./controller/postMedicationAdministrationValidate'));

if (_.get(config, "MedicationAdministration.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicationAdministration"));
}

if (_.get(config, "MedicationAdministration.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicationAdministration"));
    router.delete('/', require("./controller/condition-deleteMedicationAdministration"));
}

module.exports = router;