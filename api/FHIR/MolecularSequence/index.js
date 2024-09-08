const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MolecularSequence.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMolecularSequence'));
}

if (_.get(config, "MolecularSequence.interaction.read", true)) {
    router.get('/:id', require('./controller/getMolecularSequenceById'));
}

if (_.get(config, "MolecularSequence.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMolecularSequenceHistory'));
}

if (_.get(config, "MolecularSequence.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMolecularSequenceHistoryById'));
}

if (_.get(config, "MolecularSequence.interaction.create", true)) {
    router.post('/', require('./controller/postMolecularSequence'));
}

router.post('/([\$])validate', require('./controller/postMolecularSequenceValidate'));

if (_.get(config, "MolecularSequence.interaction.update", true)) {
    router.put('/:id', require("./controller/putMolecularSequence"));
}

if (_.get(config, "MolecularSequence.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMolecularSequence"));
    router.delete('/', require("./controller/condition-deleteMolecularSequence"));
}

module.exports = router;