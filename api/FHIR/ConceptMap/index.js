const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ConceptMap.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getConceptMap'));
}

if (_.get(config, "ConceptMap.interaction.read", true)) {
    router.get('/:id', require('./controller/getConceptMapById'));
}

if (_.get(config, "ConceptMap.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getConceptMapHistory'));
}

if (_.get(config, "ConceptMap.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getConceptMapHistoryById'));
}

if (_.get(config, "ConceptMap.interaction.create", true)) {
    router.post('/', require('./controller/postConceptMap'));
}

router.post('/([\$])validate', require('./controller/postConceptMapValidate'));

if (_.get(config, "ConceptMap.interaction.update", true)) {
    router.put('/:id', require("./controller/putConceptMap"));
}

if (_.get(config, "ConceptMap.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteConceptMap"));
    router.delete('/', require("./controller/condition-deleteConceptMap"));
}

module.exports = router;