const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "TestReport.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTestReport'));
}

if (_.get(config, "TestReport.interaction.read", true)) {
    router.get('/:id', require('./controller/getTestReportById'));
}

if (_.get(config, "TestReport.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTestReportHistory'));
}

if (_.get(config, "TestReport.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getTestReportHistoryById'));
}

if (_.get(config, "TestReport.interaction.create", true)) {
    router.post('/', require('./controller/postTestReport'));
}

router.post('/([\$])validate', require('./controller/postTestReportValidate'));

if (_.get(config, "TestReport.interaction.update", true)) {
    router.put('/:id', require("./controller/putTestReport"));
}

if (_.get(config, "TestReport.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteTestReport"));
    router.delete('/', require("./controller/condition-deleteTestReport"));
}

module.exports = router;