const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DocumentManifest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDocumentManifest'));
}

if (_.get(config, "DocumentManifest.interaction.read", true)) {
    router.get('/:id', require('./controller/getDocumentManifestById'));
}

if (_.get(config, "DocumentManifest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDocumentManifestHistory'));
}

if (_.get(config, "DocumentManifest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDocumentManifestHistoryById'));
}

if (_.get(config, "DocumentManifest.interaction.create", true)) {
    router.post('/', require('./controller/postDocumentManifest'));
}

router.post('/([\$])validate', require('./controller/postDocumentManifestValidate'));

if (_.get(config, "DocumentManifest.interaction.update", true)) {
    router.put('/:id', require("./controller/putDocumentManifest"));
}

if (_.get(config, "DocumentManifest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDocumentManifest"));
    router.delete('/', require("./controller/condition-deleteDocumentManifest"));
}

module.exports = router;