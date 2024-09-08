const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Communication.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCommunication'));
}

if (_.get(config, "Communication.interaction.read", true)) {
    router.get('/:id', require('./controller/getCommunicationById'));
}

if (_.get(config, "Communication.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCommunicationHistory'));
}

if (_.get(config, "Communication.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCommunicationHistoryById'));
}

if (_.get(config, "Communication.interaction.create", true)) {
    router.post('/', require('./controller/postCommunication'));
}

router.post('/([\$])validate', require('./controller/postCommunicationValidate'));

if (_.get(config, "Communication.interaction.update", true)) {
    router.put('/:id', require("./controller/putCommunication"));
}

if (_.get(config, "Communication.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCommunication"));
    router.delete('/', require("./controller/condition-deleteCommunication"));
}

module.exports = router;