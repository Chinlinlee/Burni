const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ResearchStudy.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchStudy'));
}

if (_.get(config, "ResearchStudy.interaction.read", true)) {
    router.get('/:id', require('./controller/getResearchStudyById'));
}

if (_.get(config, "ResearchStudy.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchStudyHistory'));
}

if (_.get(config, "ResearchStudy.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getResearchStudyHistoryById'));
}

if (_.get(config, "ResearchStudy.interaction.create", true)) {
    router.post('/', require('./controller/postResearchStudy'));
}

router.post('/([\$])validate', require('./controller/postResearchStudyValidate'));

if (_.get(config, "ResearchStudy.interaction.update", true)) {
    router.put('/:id', require("./controller/putResearchStudy"));
}

if (_.get(config, "ResearchStudy.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteResearchStudy"));
    router.delete('/', require("./controller/condition-deleteResearchStudy"));
}

module.exports = router;