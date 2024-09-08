const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Bundle.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBundle'));
}

if (_.get(config, "Bundle.interaction.read", true)) {
    router.get('/:id', require('./controller/getBundleById'));
}

if (_.get(config, "Bundle.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBundleHistory'));
}

if (_.get(config, "Bundle.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBundleHistoryById'));
}

if (_.get(config, "Bundle.interaction.create", true)) {
    router.post('/', require('./controller/postBundle'));
}

router.post('/([\$])validate', require('./controller/postBundleValidate'));

if (_.get(config, "Bundle.interaction.update", true)) {
    router.put('/:id', require("./controller/putBundle"));
}

if (_.get(config, "Bundle.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBundle"));
    router.delete('/', require("./controller/condition-deleteBundle"));
}

module.exports = router;