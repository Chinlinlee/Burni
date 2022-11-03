const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Patient.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPatient'));
}

if (_.get(config, "Patient.interaction.read", true)) {
    router.get('/:id', require('./controller/getPatientById'));
}

if (_.get(config, "Patient.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPatientHistory'));
}

if (_.get(config, "Patient.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPatientHistoryById'));
}

if (_.get(config, "Patient.interaction.create", true)) {
    router.post('/', require('./controller/postPatient'));
}

router.post('/([\$])validate', require('./controller/postPatientValidate'));

if (_.get(config, "Patient.interaction.update", true)) {
    router.put('/:id', require("./controller/putPatient"));
}

if (_.get(config, "Patient.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePatient"));
    router.delete('/', require("./controller/condition-deletePatient"));
}

module.exports = router;