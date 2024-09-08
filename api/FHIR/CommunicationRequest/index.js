const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CommunicationRequest.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCommunicationRequest'));
}

if (_.get(config, "CommunicationRequest.interaction.read", true)) {
    router.get('/:id', require('./controller/getCommunicationRequestById'));
}

if (_.get(config, "CommunicationRequest.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCommunicationRequestHistory'));
}

if (_.get(config, "CommunicationRequest.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCommunicationRequestHistoryById'));
}

if (_.get(config, "CommunicationRequest.interaction.create", true)) {
    router.post('/', require('./controller/postCommunicationRequest'));
}

router.post('/([\$])validate', require('./controller/postCommunicationRequestValidate'));

if (_.get(config, "CommunicationRequest.interaction.update", true)) {
    router.put('/:id', require("./controller/putCommunicationRequest"));
}

if (_.get(config, "CommunicationRequest.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCommunicationRequest"));
    router.delete('/', require("./controller/condition-deleteCommunicationRequest"));
}

module.exports = router;