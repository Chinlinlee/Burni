const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "TestScript.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTestScript'));
}

if (_.get(config, "TestScript.interaction.read", true)) {
    router.get('/:id', require('./controller/getTestScriptById'));
}

if (_.get(config, "TestScript.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTestScriptHistory'));
}

if (_.get(config, "TestScript.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getTestScriptHistoryById'));
}

if (_.get(config, "TestScript.interaction.create", true)) {
    router.post('/', require('./controller/postTestScript'));
}

router.post('/([\$])validate', require('./controller/postTestScriptValidate'));

if (_.get(config, "TestScript.interaction.update", true)) {
    router.put('/:id', require("./controller/putTestScript"));
}

if (_.get(config, "TestScript.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteTestScript"));
    router.delete('/', require("./controller/condition-deleteTestScript"));
}

module.exports = router;