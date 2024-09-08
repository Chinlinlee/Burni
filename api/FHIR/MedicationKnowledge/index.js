const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicationKnowledge.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationKnowledge'));
}

if (_.get(config, "MedicationKnowledge.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicationKnowledgeById'));
}

if (_.get(config, "MedicationKnowledge.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicationKnowledgeHistory'));
}

if (_.get(config, "MedicationKnowledge.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicationKnowledgeHistoryById'));
}

if (_.get(config, "MedicationKnowledge.interaction.create", true)) {
    router.post('/', require('./controller/postMedicationKnowledge'));
}

router.post('/([\$])validate', require('./controller/postMedicationKnowledgeValidate'));

if (_.get(config, "MedicationKnowledge.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicationKnowledge"));
}

if (_.get(config, "MedicationKnowledge.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicationKnowledge"));
    router.delete('/', require("./controller/condition-deleteMedicationKnowledge"));
}

module.exports = router;