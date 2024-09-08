const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Coverage.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverage'));
}

if (_.get(config, "Coverage.interaction.read", true)) {
    router.get('/:id', require('./controller/getCoverageById'));
}

if (_.get(config, "Coverage.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverageHistory'));
}

if (_.get(config, "Coverage.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCoverageHistoryById'));
}

if (_.get(config, "Coverage.interaction.create", true)) {
    router.post('/', require('./controller/postCoverage'));
}

router.post('/([\$])validate', require('./controller/postCoverageValidate'));

if (_.get(config, "Coverage.interaction.update", true)) {
    router.put('/:id', require("./controller/putCoverage"));
}

if (_.get(config, "Coverage.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCoverage"));
    router.delete('/', require("./controller/condition-deleteCoverage"));
}

module.exports = router;