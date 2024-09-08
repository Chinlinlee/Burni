const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Claim.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClaim'));
}

if (_.get(config, "Claim.interaction.read", true)) {
    router.get('/:id', require('./controller/getClaimById'));
}

if (_.get(config, "Claim.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClaimHistory'));
}

if (_.get(config, "Claim.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getClaimHistoryById'));
}

if (_.get(config, "Claim.interaction.create", true)) {
    router.post('/', require('./controller/postClaim'));
}

router.post('/([\$])validate', require('./controller/postClaimValidate'));

if (_.get(config, "Claim.interaction.update", true)) {
    router.put('/:id', require("./controller/putClaim"));
}

if (_.get(config, "Claim.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteClaim"));
    router.delete('/', require("./controller/condition-deleteClaim"));
}

module.exports = router;