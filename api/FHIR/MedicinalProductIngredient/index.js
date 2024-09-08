const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductIngredient.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductIngredient'));
}

if (_.get(config, "MedicinalProductIngredient.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductIngredientById'));
}

if (_.get(config, "MedicinalProductIngredient.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductIngredientHistory'));
}

if (_.get(config, "MedicinalProductIngredient.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductIngredientHistoryById'));
}

if (_.get(config, "MedicinalProductIngredient.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductIngredient'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductIngredientValidate'));

if (_.get(config, "MedicinalProductIngredient.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductIngredient"));
}

if (_.get(config, "MedicinalProductIngredient.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductIngredient"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductIngredient"));
}

module.exports = router;