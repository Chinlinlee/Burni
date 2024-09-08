const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "OrganizationAffiliation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOrganizationAffiliation'));
}

if (_.get(config, "OrganizationAffiliation.interaction.read", true)) {
    router.get('/:id', require('./controller/getOrganizationAffiliationById'));
}

if (_.get(config, "OrganizationAffiliation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getOrganizationAffiliationHistory'));
}

if (_.get(config, "OrganizationAffiliation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getOrganizationAffiliationHistoryById'));
}

if (_.get(config, "OrganizationAffiliation.interaction.create", true)) {
    router.post('/', require('./controller/postOrganizationAffiliation'));
}

router.post('/([\$])validate', require('./controller/postOrganizationAffiliationValidate'));

if (_.get(config, "OrganizationAffiliation.interaction.update", true)) {
    router.put('/:id', require("./controller/putOrganizationAffiliation"));
}

if (_.get(config, "OrganizationAffiliation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteOrganizationAffiliation"));
    router.delete('/', require("./controller/condition-deleteOrganizationAffiliation"));
}

module.exports = router;