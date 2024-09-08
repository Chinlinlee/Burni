const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EffectEvidenceSynthesis.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEffectEvidenceSynthesis'));
}

if (_.get(config, "EffectEvidenceSynthesis.interaction.read", true)) {
    router.get('/:id', require('./controller/getEffectEvidenceSynthesisById'));
}

if (_.get(config, "EffectEvidenceSynthesis.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEffectEvidenceSynthesisHistory'));
}

if (_.get(config, "EffectEvidenceSynthesis.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEffectEvidenceSynthesisHistoryById'));
}

if (_.get(config, "EffectEvidenceSynthesis.interaction.create", true)) {
    router.post('/', require('./controller/postEffectEvidenceSynthesis'));
}

router.post('/([\$])validate', require('./controller/postEffectEvidenceSynthesisValidate'));

if (_.get(config, "EffectEvidenceSynthesis.interaction.update", true)) {
    router.put('/:id', require("./controller/putEffectEvidenceSynthesis"));
}

if (_.get(config, "EffectEvidenceSynthesis.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEffectEvidenceSynthesis"));
    router.delete('/', require("./controller/condition-deleteEffectEvidenceSynthesis"));
}

module.exports = router;