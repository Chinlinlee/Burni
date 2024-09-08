const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "ImagingStudy.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImagingStudy'));
}

if (_.get(config, "ImagingStudy.interaction.read", true)) {
    router.get('/:id', require('./controller/getImagingStudyById'));
}

if (_.get(config, "ImagingStudy.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getImagingStudyHistory'));
}

if (_.get(config, "ImagingStudy.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getImagingStudyHistoryById'));
}

if (_.get(config, "ImagingStudy.interaction.create", true)) {
    router.post('/', require('./controller/postImagingStudy'));
}

router.post('/([\$])validate', require('./controller/postImagingStudyValidate'));

if (_.get(config, "ImagingStudy.interaction.update", true)) {
    router.put('/:id', require("./controller/putImagingStudy"));
}

if (_.get(config, "ImagingStudy.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteImagingStudy"));
    router.delete('/', require("./controller/condition-deleteImagingStudy"));
}

module.exports = router;