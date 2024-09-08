const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ResearchSubject.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchSubject'));
}

if (_.get(config, "ResearchSubject.interaction.read", true)) {
    router.get('/:id', require('./controller/getResearchSubjectById'));
}

if (_.get(config, "ResearchSubject.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getResearchSubjectHistory'));
}

if (_.get(config, "ResearchSubject.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getResearchSubjectHistoryById'));
}

if (_.get(config, "ResearchSubject.interaction.create", true)) {
    router.post('/', require('./controller/postResearchSubject'));
}

router.post('/([\$])validate', require('./controller/postResearchSubjectValidate'));

if (_.get(config, "ResearchSubject.interaction.update", true)) {
    router.put('/:id', require("./controller/putResearchSubject"));
}

if (_.get(config, "ResearchSubject.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteResearchSubject"));
    router.delete('/', require("./controller/condition-deleteResearchSubject"));
}

module.exports = router;