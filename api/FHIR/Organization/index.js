const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Organization.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOrganization'));
}

if (_.get(config, "Organization.interaction.read", true)) {
    router.get('/:id', require('./controller/getOrganizationById'));
}

if (_.get(config, "Organization.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOrganizationHistory'));
}

if (_.get(config, "Organization.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getOrganizationHistoryById'));
}

if (_.get(config, "Organization.interaction.create", true)) {
    router.post('/', require('./controller/postOrganization'));
}

router.post('/([\$])validate', require('./controller/postOrganizationValidate'));

if (_.get(config, "Organization.interaction.update", true)) {
    router.put('/:id', require("./controller/putOrganization"));
}

if (_.get(config, "Organization.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteOrganization"));
    router.delete('/', require("./controller/condition-deleteOrganization"));
}

module.exports = router;