const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MessageHeader.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMessageHeader'));
}

if (_.get(config, "MessageHeader.interaction.read", true)) {
    router.get('/:id', require('./controller/getMessageHeaderById'));
}

if (_.get(config, "MessageHeader.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMessageHeaderHistory'));
}

if (_.get(config, "MessageHeader.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMessageHeaderHistoryById'));
}

if (_.get(config, "MessageHeader.interaction.create", true)) {
    router.post('/', require('./controller/postMessageHeader'));
}

router.post('/([\$])validate', require('./controller/postMessageHeaderValidate'));

if (_.get(config, "MessageHeader.interaction.update", true)) {
    router.put('/:id', require("./controller/putMessageHeader"));
}

if (_.get(config, "MessageHeader.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMessageHeader"));
    router.delete('/', require("./controller/condition-deleteMessageHeader"));
}

module.exports = router;