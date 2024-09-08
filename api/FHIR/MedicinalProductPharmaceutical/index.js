const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductPharmaceutical.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductPharmaceutical'));
}

if (_.get(config, "MedicinalProductPharmaceutical.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductPharmaceuticalById'));
}

if (_.get(config, "MedicinalProductPharmaceutical.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductPharmaceuticalHistory'));
}

if (_.get(config, "MedicinalProductPharmaceutical.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductPharmaceuticalHistoryById'));
}

if (_.get(config, "MedicinalProductPharmaceutical.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductPharmaceutical'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductPharmaceuticalValidate'));

if (_.get(config, "MedicinalProductPharmaceutical.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductPharmaceutical"));
}

if (_.get(config, "MedicinalProductPharmaceutical.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductPharmaceutical"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductPharmaceutical"));
}

module.exports = router;