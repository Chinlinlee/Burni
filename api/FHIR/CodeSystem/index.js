const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CodeSystem.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCodeSystem'));
}

if (_.get(config, "CodeSystem.interaction.read", true)) {
    router.get('/:id', require('./controller/getCodeSystemById'));
}

if (_.get(config, "CodeSystem.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCodeSystemHistory'));
}

if (_.get(config, "CodeSystem.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCodeSystemHistoryById'));
}

if (_.get(config, "CodeSystem.interaction.create", true)) {
    router.post('/', require('./controller/postCodeSystem'));
}

router.post('/([\$])validate', require('./controller/postCodeSystemValidate'));

if (_.get(config, "CodeSystem.interaction.update", true)) {
    router.put('/:id', require("./controller/putCodeSystem"));
}

if (_.get(config, "CodeSystem.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCodeSystem"));
    router.delete('/', require("./controller/condition-deleteCodeSystem"));
}

module.exports = router;