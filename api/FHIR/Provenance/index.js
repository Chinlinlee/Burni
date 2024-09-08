const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Provenance.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getProvenance'));
}

if (_.get(config, "Provenance.interaction.read", true)) {
    router.get('/:id', require('./controller/getProvenanceById'));
}

if (_.get(config, "Provenance.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getProvenanceHistory'));
}

if (_.get(config, "Provenance.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getProvenanceHistoryById'));
}

if (_.get(config, "Provenance.interaction.create", true)) {
    router.post('/', require('./controller/postProvenance'));
}

router.post('/([\$])validate', require('./controller/postProvenanceValidate'));

if (_.get(config, "Provenance.interaction.update", true)) {
    router.put('/:id', require("./controller/putProvenance"));
}

if (_.get(config, "Provenance.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteProvenance"));
    router.delete('/', require("./controller/condition-deleteProvenance"));
}

module.exports = router;