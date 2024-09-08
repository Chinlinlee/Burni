const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MeasureReport.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMeasureReport'));
}

if (_.get(config, "MeasureReport.interaction.read", true)) {
    router.get('/:id', require('./controller/getMeasureReportById'));
}

if (_.get(config, "MeasureReport.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMeasureReportHistory'));
}

if (_.get(config, "MeasureReport.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMeasureReportHistoryById'));
}

if (_.get(config, "MeasureReport.interaction.create", true)) {
    router.post('/', require('./controller/postMeasureReport'));
}

router.post('/([\$])validate', require('./controller/postMeasureReportValidate'));

if (_.get(config, "MeasureReport.interaction.update", true)) {
    router.put('/:id', require("./controller/putMeasureReport"));
}

if (_.get(config, "MeasureReport.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMeasureReport"));
    router.delete('/', require("./controller/condition-deleteMeasureReport"));
}

module.exports = router;