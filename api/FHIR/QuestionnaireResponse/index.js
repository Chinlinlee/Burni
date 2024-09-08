const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "QuestionnaireResponse.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getQuestionnaireResponse'));
}

if (_.get(config, "QuestionnaireResponse.interaction.read", true)) {
    router.get('/:id', require('./controller/getQuestionnaireResponseById'));
}

if (_.get(config, "QuestionnaireResponse.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getQuestionnaireResponseHistory'));
}

if (_.get(config, "QuestionnaireResponse.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getQuestionnaireResponseHistoryById'));
}

if (_.get(config, "QuestionnaireResponse.interaction.create", true)) {
    router.post('/', require('./controller/postQuestionnaireResponse'));
}

router.post('/([\$])validate', require('./controller/postQuestionnaireResponseValidate'));

if (_.get(config, "QuestionnaireResponse.interaction.update", true)) {
    router.put('/:id', require("./controller/putQuestionnaireResponse"));
}

if (_.get(config, "QuestionnaireResponse.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteQuestionnaireResponse"));
    router.delete('/', require("./controller/condition-deleteQuestionnaireResponse"));
}

module.exports = router;