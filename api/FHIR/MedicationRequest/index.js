const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicationRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationRequest'));
}

if (_.get(config, "MedicationRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationRequestById'));
}

if (_.get(config, "MedicationRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationRequestHistory'));
}

if (_.get(config, "MedicationRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationRequestHistoryById'));
}

if (_.get(config, "MedicationRequest.interaction.create", true)) {
    router.post('/', require('./controller/postMedicationRequest'));
}

router.post('/([\$])validate', require('./controller/postMedicationRequestValidate'));

if (_.get(config, "MedicationRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicationRequest"));
}

if (_.get(config, "MedicationRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicationRequest"));
    router.delete('/', require("./controller/condition-deleteMedicationRequest"));
}

module.exports = router;