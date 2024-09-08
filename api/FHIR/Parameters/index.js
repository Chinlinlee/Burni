const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Parameters.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getParameters'));
}

if (_.get(config, "Parameters.interaction.read", true)) {
    router.get('/:id', require('./controller/getParametersById'));
}

if (_.get(config, "Parameters.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getParametersHistory'));
}

if (_.get(config, "Parameters.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getParametersHistoryById'));
}

if (_.get(config, "Parameters.interaction.create", true)) {
    router.post('/', require('./controller/postParameters'));
}

router.post('/([\$])validate', require('./controller/postParametersValidate'));

if (_.get(config, "Parameters.interaction.update", true)) {
    router.put('/:id', require("./controller/putParameters"));
}

if (_.get(config, "Parameters.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteParameters"));
    router.delete('/', require("./controller/condition-deleteParameters"));
}

module.exports = router;