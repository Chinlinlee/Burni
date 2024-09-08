const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Composition.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getComposition'));
}

if (_.get(config, "Composition.interaction.read", true)) {
    router.get('/:id', require('./controller/getCompositionById'));
}

if (_.get(config, "Composition.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCompositionHistory'));
}

if (_.get(config, "Composition.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCompositionHistoryById'));
}

if (_.get(config, "Composition.interaction.create", true)) {
    router.post('/', require('./controller/postComposition'));
}

router.post('/([\$])validate', require('./controller/postCompositionValidate'));

if (_.get(config, "Composition.interaction.update", true)) {
    router.put('/:id', require("./controller/putComposition"));
}

if (_.get(config, "Composition.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteComposition"));
    router.delete('/', require("./controller/condition-deleteComposition"));
}

module.exports = router;