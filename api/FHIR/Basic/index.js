const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Basic.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBasic'));
}

if (_.get(config, "Basic.interaction.read", true)) {
    router.get('/:id', require('./controller/getBasicById'));
}

if (_.get(config, "Basic.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBasicHistory'));
}

if (_.get(config, "Basic.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBasicHistoryById'));
}

if (_.get(config, "Basic.interaction.create", true)) {
    router.post('/', require('./controller/postBasic'));
}

router.post('/([\$])validate', require('./controller/postBasicValidate'));

if (_.get(config, "Basic.interaction.update", true)) {
    router.put('/:id', require("./controller/putBasic"));
}

if (_.get(config, "Basic.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBasic"));
    router.delete('/', require("./controller/condition-deleteBasic"));
}

module.exports = router;