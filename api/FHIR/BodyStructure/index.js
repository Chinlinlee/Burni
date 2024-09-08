const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "BodyStructure.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBodyStructure'));
}

if (_.get(config, "BodyStructure.interaction.read", true)) {
    router.get('/:id', require('./controller/getBodyStructureById'));
}

if (_.get(config, "BodyStructure.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBodyStructureHistory'));
}

if (_.get(config, "BodyStructure.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBodyStructureHistoryById'));
}

if (_.get(config, "BodyStructure.interaction.create", true)) {
    router.post('/', require('./controller/postBodyStructure'));
}

router.post('/([\$])validate', require('./controller/postBodyStructureValidate'));

if (_.get(config, "BodyStructure.interaction.update", true)) {
    router.put('/:id', require("./controller/putBodyStructure"));
}

if (_.get(config, "BodyStructure.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBodyStructure"));
    router.delete('/', require("./controller/condition-deleteBodyStructure"));
}

module.exports = router;