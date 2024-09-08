const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductPackaged.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductPackaged'));
}

if (_.get(config, "MedicinalProductPackaged.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductPackagedById'));
}

if (_.get(config, "MedicinalProductPackaged.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductPackagedHistory'));
}

if (_.get(config, "MedicinalProductPackaged.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductPackagedHistoryById'));
}

if (_.get(config, "MedicinalProductPackaged.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductPackaged'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductPackagedValidate'));

if (_.get(config, "MedicinalProductPackaged.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductPackaged"));
}

if (_.get(config, "MedicinalProductPackaged.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductPackaged"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductPackaged"));
}

module.exports = router;