const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Measure.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMeasure'));
}

if (_.get(config, "Measure.interaction.read", true)) {
    router.get('/:id', require('./controller/getMeasureById'));
}

if (_.get(config, "Measure.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMeasureHistory'));
}

if (_.get(config, "Measure.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMeasureHistoryById'));
}

if (_.get(config, "Measure.interaction.create", true)) {
    router.post('/', require('./controller/postMeasure'));
}

router.post('/([\$])validate', require('./controller/postMeasureValidate'));

if (_.get(config, "Measure.interaction.update", true)) {
    router.put('/:id', require("./controller/putMeasure"));
}

if (_.get(config, "Measure.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMeasure"));
    router.delete('/', require("./controller/condition-deleteMeasure"));
}

module.exports = router;