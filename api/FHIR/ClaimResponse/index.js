const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ClaimResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClaimResponse'));
}

if (_.get(config, "ClaimResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getClaimResponseById'));
}

if (_.get(config, "ClaimResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getClaimResponseHistory'));
}

if (_.get(config, "ClaimResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getClaimResponseHistoryById'));
}

if (_.get(config, "ClaimResponse.interaction.create", true)) {
    router.post('/', require('./controller/postClaimResponse'));
}

router.post('/([\$])validate', require('./controller/postClaimResponseValidate'));

if (_.get(config, "ClaimResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putClaimResponse"));
}

if (_.get(config, "ClaimResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteClaimResponse"));
    router.delete('/', require("./controller/condition-deleteClaimResponse"));
}

module.exports = router;