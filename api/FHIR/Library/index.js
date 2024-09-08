const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Library.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLibrary'));
}

if (_.get(config, "Library.interaction.read", true)) {
    router.get('/:id', require('./controller/getLibraryById'));
}

if (_.get(config, "Library.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLibraryHistory'));
}

if (_.get(config, "Library.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getLibraryHistoryById'));
}

if (_.get(config, "Library.interaction.create", true)) {
    router.post('/', require('./controller/postLibrary'));
}

router.post('/([\$])validate', require('./controller/postLibraryValidate'));

if (_.get(config, "Library.interaction.update", true)) {
    router.put('/:id', require("./controller/putLibrary"));
}

if (_.get(config, "Library.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteLibrary"));
    router.delete('/', require("./controller/condition-deleteLibrary"));
}

module.exports = router;