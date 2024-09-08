const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CoverageEligibilityResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverageEligibilityResponse'));
}

if (_.get(config, "CoverageEligibilityResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getCoverageEligibilityResponseById'));
}

if (_.get(config, "CoverageEligibilityResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverageEligibilityResponseHistory'));
}

if (_.get(config, "CoverageEligibilityResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCoverageEligibilityResponseHistoryById'));
}

if (_.get(config, "CoverageEligibilityResponse.interaction.create", true)) {
    router.post('/', require('./controller/postCoverageEligibilityResponse'));
}

router.post('/([\$])validate', require('./controller/postCoverageEligibilityResponseValidate'));

if (_.get(config, "CoverageEligibilityResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putCoverageEligibilityResponse"));
}

if (_.get(config, "CoverageEligibilityResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCoverageEligibilityResponse"));
    router.delete('/', require("./controller/condition-deleteCoverageEligibilityResponse"));
}

module.exports = router;