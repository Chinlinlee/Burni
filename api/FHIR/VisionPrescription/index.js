const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "VisionPrescription.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getVisionPrescription'));
}

if (_.get(config, "VisionPrescription.interaction.read", true)) {
    router.get('/:id', require('./controller/getVisionPrescriptionById'));
}

if (_.get(config, "VisionPrescription.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getVisionPrescriptionHistory'));
}

if (_.get(config, "VisionPrescription.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getVisionPrescriptionHistoryById'));
}

if (_.get(config, "VisionPrescription.interaction.create", true)) {
    router.post('/', require('./controller/postVisionPrescription'));
}

router.post('/([\$])validate', require('./controller/postVisionPrescriptionValidate'));

if (_.get(config, "VisionPrescription.interaction.update", true)) {
    router.put('/:id', require("./controller/putVisionPrescription"));
}

if (_.get(config, "VisionPrescription.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteVisionPrescription"));
    router.delete('/', require("./controller/condition-deleteVisionPrescription"));
}

module.exports = router;