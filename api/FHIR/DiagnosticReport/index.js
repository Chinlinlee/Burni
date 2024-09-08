const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DiagnosticReport.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDiagnosticReport'));
}

if (_.get(config, "DiagnosticReport.interaction.read", true)) {
    router.get('/:id', require('./controller/getDiagnosticReportById'));
}

if (_.get(config, "DiagnosticReport.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDiagnosticReportHistory'));
}

if (_.get(config, "DiagnosticReport.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDiagnosticReportHistoryById'));
}

if (_.get(config, "DiagnosticReport.interaction.create", true)) {
    router.post('/', require('./controller/postDiagnosticReport'));
}

router.post('/([\$])validate', require('./controller/postDiagnosticReportValidate'));

if (_.get(config, "DiagnosticReport.interaction.update", true)) {
    router.put('/:id', require("./controller/putDiagnosticReport"));
}

if (_.get(config, "DiagnosticReport.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDiagnosticReport"));
    router.delete('/', require("./controller/condition-deleteDiagnosticReport"));
}

module.exports = router;