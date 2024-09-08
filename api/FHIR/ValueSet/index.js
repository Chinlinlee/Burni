const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ValueSet.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getValueSet'));
}

if (_.get(config, "ValueSet.interaction.read", true)) {
    router.get('/:id', require('./controller/getValueSetById'));
}

if (_.get(config, "ValueSet.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getValueSetHistory'));
}

if (_.get(config, "ValueSet.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getValueSetHistoryById'));
}

if (_.get(config, "ValueSet.interaction.create", true)) {
    router.post('/', require('./controller/postValueSet'));
}

router.post('/([\$])validate', require('./controller/postValueSetValidate'));

if (_.get(config, "ValueSet.interaction.update", true)) {
    router.put('/:id', require("./controller/putValueSet"));
}

if (_.get(config, "ValueSet.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteValueSet"));
    router.delete('/', require("./controller/condition-deleteValueSet"));
}

module.exports = router;