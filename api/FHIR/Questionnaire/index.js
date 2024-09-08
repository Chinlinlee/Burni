const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Questionnaire.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getQuestionnaire'));
}

if (_.get(config, "Questionnaire.interaction.read", true)) {
    router.get('/:id', require('./controller/getQuestionnaireById'));
}

if (_.get(config, "Questionnaire.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getQuestionnaireHistory'));
}

if (_.get(config, "Questionnaire.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getQuestionnaireHistoryById'));
}

if (_.get(config, "Questionnaire.interaction.create", true)) {
    router.post('/', require('./controller/postQuestionnaire'));
}

router.post('/([\$])validate', require('./controller/postQuestionnaireValidate'));

if (_.get(config, "Questionnaire.interaction.update", true)) {
    router.put('/:id', require("./controller/putQuestionnaire"));
}

if (_.get(config, "Questionnaire.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteQuestionnaire"));
    router.delete('/', require("./controller/condition-deleteQuestionnaire"));
}

module.exports = router;