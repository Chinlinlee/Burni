const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicationStatement.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationStatement'));
}

if (_.get(config, "MedicationStatement.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationStatementById'));
}

if (_.get(config, "MedicationStatement.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationStatementHistory'));
}

if (_.get(config, "MedicationStatement.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationStatementHistoryById'));
}

if (_.get(config, "MedicationStatement.interaction.create", true)) {
    router.post('/', require('./controller/postMedicationStatement'));
}

router.post('/([\$])validate', require('./controller/postMedicationStatementValidate'));

if (_.get(config, "MedicationStatement.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicationStatement"));
}

if (_.get(config, "MedicationStatement.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicationStatement"));
    router.delete('/', require("./controller/condition-deleteMedicationStatement"));
}

module.exports = router;