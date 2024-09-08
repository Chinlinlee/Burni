const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductContraindication.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductContraindication'));
}

if (_.get(config, "MedicinalProductContraindication.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductContraindicationById'));
}

if (_.get(config, "MedicinalProductContraindication.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductContraindicationHistory'));
}

if (_.get(config, "MedicinalProductContraindication.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductContraindicationHistoryById'));
}

if (_.get(config, "MedicinalProductContraindication.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductContraindication'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductContraindicationValidate'));

if (_.get(config, "MedicinalProductContraindication.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductContraindication"));
}

if (_.get(config, "MedicinalProductContraindication.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductContraindication"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductContraindication"));
}

module.exports = router;