const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Media.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedia'));
}

if (_.get(config, "Media.interaction.read", true)) {
    router.get('/:id', require('./controller/getMediaById'));
}

if (_.get(config, "Media.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMediaHistory'));
}

if (_.get(config, "Media.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMediaHistoryById'));
}

if (_.get(config, "Media.interaction.create", true)) {
    router.post('/', require('./controller/postMedia'));
}

router.post('/([\$])validate', require('./controller/postMediaValidate'));

if (_.get(config, "Media.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedia"));
}

if (_.get(config, "Media.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedia"));
    router.delete('/', require("./controller/condition-deleteMedia"));
}

module.exports = router;