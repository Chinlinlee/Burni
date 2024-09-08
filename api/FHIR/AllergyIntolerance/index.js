const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "AllergyIntolerance.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAllergyIntolerance'));
}

if (_.get(config, "AllergyIntolerance.interaction.read", true)) {
    router.get('/:id', require('./controller/getAllergyIntoleranceById'));
}

if (_.get(config, "AllergyIntolerance.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAllergyIntoleranceHistory'));
}

if (_.get(config, "AllergyIntolerance.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAllergyIntoleranceHistoryById'));
}

if (_.get(config, "AllergyIntolerance.interaction.create", true)) {
    router.post('/', require('./controller/postAllergyIntolerance'));
}

router.post('/([\$])validate', require('./controller/postAllergyIntoleranceValidate'));

if (_.get(config, "AllergyIntolerance.interaction.update", true)) {
    router.put('/:id', require("./controller/putAllergyIntolerance"));
}

if (_.get(config, "AllergyIntolerance.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAllergyIntolerance"));
    router.delete('/', require("./controller/condition-deleteAllergyIntolerance"));
}

module.exports = router;