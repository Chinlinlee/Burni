const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "DocumentReference.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDocumentReference'));
}

if (_.get(config, "DocumentReference.interaction.read", true)) {
    router.get('/:id', require('./controller/getDocumentReferenceById'));
}

if (_.get(config, "DocumentReference.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getDocumentReferenceHistory'));
}

if (_.get(config, "DocumentReference.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getDocumentReferenceHistoryById'));
}

if (_.get(config, "DocumentReference.interaction.create", true)) {
    router.post('/', require('./controller/postDocumentReference'));
}

router.post('/([\$])validate', require('./controller/postDocumentReferenceValidate'));

if (_.get(config, "DocumentReference.interaction.update", true)) {
    router.put('/:id', require("./controller/putDocumentReference"));
}

if (_.get(config, "DocumentReference.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteDocumentReference"));
    router.delete('/', require("./controller/condition-deleteDocumentReference"));
}

module.exports = router;