const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductInteraction.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductInteraction'));
}

if (_.get(config, "MedicinalProductInteraction.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductInteractionById'));
}

if (_.get(config, "MedicinalProductInteraction.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductInteractionHistory'));
}

if (_.get(config, "MedicinalProductInteraction.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductInteractionHistoryById'));
}

if (_.get(config, "MedicinalProductInteraction.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductInteraction'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductInteractionValidate'));

if (_.get(config, "MedicinalProductInteraction.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductInteraction"));
}

if (_.get(config, "MedicinalProductInteraction.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductInteraction"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductInteraction"));
}

module.exports = router;