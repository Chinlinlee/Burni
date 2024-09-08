const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductManufactured.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductManufactured'));
}

if (_.get(config, "MedicinalProductManufactured.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductManufacturedById'));
}

if (_.get(config, "MedicinalProductManufactured.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductManufacturedHistory'));
}

if (_.get(config, "MedicinalProductManufactured.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductManufacturedHistoryById'));
}

if (_.get(config, "MedicinalProductManufactured.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductManufactured'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductManufacturedValidate'));

if (_.get(config, "MedicinalProductManufactured.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductManufactured"));
}

if (_.get(config, "MedicinalProductManufactured.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductManufactured"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductManufactured"));
}

module.exports = router;