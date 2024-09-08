const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Flag.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getFlag'));
}

if (_.get(config, "Flag.interaction.read", true)) {
    router.get('/:id', require('./controller/getFlagById'));
}

if (_.get(config, "Flag.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getFlagHistory'));
}

if (_.get(config, "Flag.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getFlagHistoryById'));
}

if (_.get(config, "Flag.interaction.create", true)) {
    router.post('/', require('./controller/postFlag'));
}

router.post('/([\$])validate', require('./controller/postFlagValidate'));

if (_.get(config, "Flag.interaction.update", true)) {
    router.put('/:id', require("./controller/putFlag"));
}

if (_.get(config, "Flag.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteFlag"));
    router.delete('/', require("./controller/condition-deleteFlag"));
}

module.exports = router;