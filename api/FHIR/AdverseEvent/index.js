const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "AdverseEvent.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAdverseEvent'));
}

if (_.get(config, "AdverseEvent.interaction.read", true)) {
    router.get('/:id', require('./controller/getAdverseEventById'));
}

if (_.get(config, "AdverseEvent.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAdverseEventHistory'));
}

if (_.get(config, "AdverseEvent.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAdverseEventHistoryById'));
}

if (_.get(config, "AdverseEvent.interaction.create", true)) {
    router.post('/', require('./controller/postAdverseEvent'));
}

router.post('/([\$])validate', require('./controller/postAdverseEventValidate'));

if (_.get(config, "AdverseEvent.interaction.update", true)) {
    router.put('/:id', require("./controller/putAdverseEvent"));
}

if (_.get(config, "AdverseEvent.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAdverseEvent"));
    router.delete('/', require("./controller/condition-deleteAdverseEvent"));
}

module.exports = router;