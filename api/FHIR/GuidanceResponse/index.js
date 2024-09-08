const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "GuidanceResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGuidanceResponse'));
}

if (_.get(config, "GuidanceResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getGuidanceResponseById'));
}

if (_.get(config, "GuidanceResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGuidanceResponseHistory'));
}

if (_.get(config, "GuidanceResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getGuidanceResponseHistoryById'));
}

if (_.get(config, "GuidanceResponse.interaction.create", true)) {
    router.post('/', require('./controller/postGuidanceResponse'));
}

router.post('/([\$])validate', require('./controller/postGuidanceResponseValidate'));

if (_.get(config, "GuidanceResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putGuidanceResponse"));
}

if (_.get(config, "GuidanceResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteGuidanceResponse"));
    router.delete('/', require("./controller/condition-deleteGuidanceResponse"));
}

module.exports = router;