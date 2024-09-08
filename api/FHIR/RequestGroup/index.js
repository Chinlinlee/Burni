const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "RequestGroup.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRequestGroup'));
}

if (_.get(config, "RequestGroup.interaction.read", true)) {
    router.get('/:id', require('./controller/getRequestGroupById'));
}

if (_.get(config, "RequestGroup.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getRequestGroupHistory'));
}

if (_.get(config, "RequestGroup.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getRequestGroupHistoryById'));
}

if (_.get(config, "RequestGroup.interaction.create", true)) {
    router.post('/', require('./controller/postRequestGroup'));
}

router.post('/([\$])validate', require('./controller/postRequestGroupValidate'));

if (_.get(config, "RequestGroup.interaction.update", true)) {
    router.put('/:id', require("./controller/putRequestGroup"));
}

if (_.get(config, "RequestGroup.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteRequestGroup"));
    router.delete('/', require("./controller/condition-deleteRequestGroup"));
}

module.exports = router;