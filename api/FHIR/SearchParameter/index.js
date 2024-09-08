const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SearchParameter.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSearchParameter'));
}

if (_.get(config, "SearchParameter.interaction.read", true)) {
    router.get('/:id', require('./controller/getSearchParameterById'));
}

if (_.get(config, "SearchParameter.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSearchParameterHistory'));
}

if (_.get(config, "SearchParameter.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSearchParameterHistoryById'));
}

if (_.get(config, "SearchParameter.interaction.create", true)) {
    router.post('/', require('./controller/postSearchParameter'));
}

router.post('/([\$])validate', require('./controller/postSearchParameterValidate'));

if (_.get(config, "SearchParameter.interaction.update", true)) {
    router.put('/:id', require("./controller/putSearchParameter"));
}

if (_.get(config, "SearchParameter.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSearchParameter"));
    router.delete('/', require("./controller/condition-deleteSearchParameter"));
}

module.exports = router;