const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CoverageEligibilityRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverageEligibilityRequest'));
}

if (_.get(config, "CoverageEligibilityRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getCoverageEligibilityRequestById'));
}

if (_.get(config, "CoverageEligibilityRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCoverageEligibilityRequestHistory'));
}

if (_.get(config, "CoverageEligibilityRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCoverageEligibilityRequestHistoryById'));
}

if (_.get(config, "CoverageEligibilityRequest.interaction.create", true)) {
    router.post('/', require('./controller/postCoverageEligibilityRequest'));
}

router.post('/([\$])validate', require('./controller/postCoverageEligibilityRequestValidate'));

if (_.get(config, "CoverageEligibilityRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putCoverageEligibilityRequest"));
}

if (_.get(config, "CoverageEligibilityRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCoverageEligibilityRequest"));
    router.delete('/', require("./controller/condition-deleteCoverageEligibilityRequest"));
}

module.exports = router;