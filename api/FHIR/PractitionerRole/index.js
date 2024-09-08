const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "PractitionerRole.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPractitionerRole'));
}

if (_.get(config, "PractitionerRole.interaction.read", true)) {
    router.get('/:id', require('./controller/getPractitionerRoleById'));
}

if (_.get(config, "PractitionerRole.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPractitionerRoleHistory'));
}

if (_.get(config, "PractitionerRole.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPractitionerRoleHistoryById'));
}

if (_.get(config, "PractitionerRole.interaction.create", true)) {
    router.post('/', require('./controller/postPractitionerRole'));
}

router.post('/([\$])validate', require('./controller/postPractitionerRoleValidate'));

if (_.get(config, "PractitionerRole.interaction.update", true)) {
    router.put('/:id', require("./controller/putPractitionerRole"));
}

if (_.get(config, "PractitionerRole.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePractitionerRole"));
    router.delete('/', require("./controller/condition-deletePractitionerRole"));
}

module.exports = router;