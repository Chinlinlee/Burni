const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Contract.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getContract'));
}

if (_.get(config, "Contract.interaction.read", true)) {
    router.get('/:id', require('./controller/getContractById'));
}

if (_.get(config, "Contract.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getContractHistory'));
}

if (_.get(config, "Contract.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getContractHistoryById'));
}

if (_.get(config, "Contract.interaction.create", true)) {
    router.post('/', require('./controller/postContract'));
}

router.post('/([\$])validate', require('./controller/postContractValidate'));

if (_.get(config, "Contract.interaction.update", true)) {
    router.put('/:id', require("./controller/putContract"));
}

if (_.get(config, "Contract.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteContract"));
    router.delete('/', require("./controller/condition-deleteContract"));
}

module.exports = router;