const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicationDispense.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationDispense'));
}

if (_.get(config, "MedicationDispense.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationDispenseById'));
}

if (_.get(config, "MedicationDispense.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationDispenseHistory'));
}

if (_.get(config, "MedicationDispense.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationDispenseHistoryById'));
}

if (_.get(config, "MedicationDispense.interaction.create", true)) {
    router.post('/', require('./controller/postMedicationDispense'));
}

router.post('/([\$])validate', require('./controller/postMedicationDispenseValidate'));

if (_.get(config, "MedicationDispense.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicationDispense"));
}

if (_.get(config, "MedicationDispense.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicationDispense"));
    router.delete('/', require("./controller/condition-deleteMedicationDispense"));
}

module.exports = router;