const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "AuditEvent.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAuditEvent'));
}

if (_.get(config, "AuditEvent.interaction.read", true)) {
    router.get('/:id', require('./controller/getAuditEventById'));
}

if (_.get(config, "AuditEvent.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getAuditEventHistory'));
}

if (_.get(config, "AuditEvent.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getAuditEventHistoryById'));
}

if (_.get(config, "AuditEvent.interaction.create", true)) {
    router.post('/', require('./controller/postAuditEvent'));
}

router.post('/([\$])validate', require('./controller/postAuditEventValidate'));

if (_.get(config, "AuditEvent.interaction.update", true)) {
    router.put('/:id', require("./controller/putAuditEvent"));
}

if (_.get(config, "AuditEvent.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteAuditEvent"));
    router.delete('/', require("./controller/condition-deleteAuditEvent"));
}

module.exports = router;