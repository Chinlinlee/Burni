const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProduct.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProduct'));
}

if (_.get(config, "MedicinalProduct.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductById'));
}

if (_.get(config, "MedicinalProduct.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductHistory'));
}

if (_.get(config, "MedicinalProduct.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductHistoryById'));
}

if (_.get(config, "MedicinalProduct.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProduct'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductValidate'));

if (_.get(config, "MedicinalProduct.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProduct"));
}

if (_.get(config, "MedicinalProduct.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProduct"));
    router.delete('/', require("./controller/condition-deleteMedicinalProduct"));
}

module.exports = router;