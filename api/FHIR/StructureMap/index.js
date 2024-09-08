const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "StructureMap.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getStructureMap'));
}

if (_.get(config, "StructureMap.interaction.read", true)) {
    router.get('/:id', require('./controller/getStructureMapById'));
}

if (_.get(config, "StructureMap.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getStructureMapHistory'));
}

if (_.get(config, "StructureMap.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getStructureMapHistoryById'));
}

if (_.get(config, "StructureMap.interaction.create", true)) {
    router.post('/', require('./controller/postStructureMap'));
}

router.post('/([\$])validate', require('./controller/postStructureMapValidate'));

if (_.get(config, "StructureMap.interaction.update", true)) {
    router.put('/:id', require("./controller/putStructureMap"));
}

if (_.get(config, "StructureMap.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteStructureMap"));
    router.delete('/', require("./controller/condition-deleteStructureMap"));
}

module.exports = router;