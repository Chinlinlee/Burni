const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ImplementationGuide.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImplementationGuide'));
}

if (_.get(config, "ImplementationGuide.interaction.read", true)) {
    router.get('/:id', require('./controller/getImplementationGuideById'));
}

if (_.get(config, "ImplementationGuide.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImplementationGuideHistory'));
}

if (_.get(config, "ImplementationGuide.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getImplementationGuideHistoryById'));
}

if (_.get(config, "ImplementationGuide.interaction.create", true)) {
    router.post('/', require('./controller/postImplementationGuide'));
}

router.post('/([\$])validate', require('./controller/postImplementationGuideValidate'));

if (_.get(config, "ImplementationGuide.interaction.update", true)) {
    router.put('/:id', require("./controller/putImplementationGuide"));
}

if (_.get(config, "ImplementationGuide.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteImplementationGuide"));
    router.delete('/', require("./controller/condition-deleteImplementationGuide"));
}

module.exports = router;