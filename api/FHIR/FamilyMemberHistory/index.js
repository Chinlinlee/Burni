const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "FamilyMemberHistory.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getFamilyMemberHistory'));
}

if (_.get(config, "FamilyMemberHistory.interaction.read", true)) {
    router.get('/:id', require('./controller/getFamilyMemberHistoryById'));
}

if (_.get(config, "FamilyMemberHistory.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getFamilyMemberHistoryHistory'));
}

if (_.get(config, "FamilyMemberHistory.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getFamilyMemberHistoryHistoryById'));
}

if (_.get(config, "FamilyMemberHistory.interaction.create", true)) {
    router.post('/', require('./controller/postFamilyMemberHistory'));
}

router.post('/([\$])validate', require('./controller/postFamilyMemberHistoryValidate'));

if (_.get(config, "FamilyMemberHistory.interaction.update", true)) {
    router.put('/:id', require("./controller/putFamilyMemberHistory"));
}

if (_.get(config, "FamilyMemberHistory.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteFamilyMemberHistory"));
    router.delete('/', require("./controller/condition-deleteFamilyMemberHistory"));
}

module.exports = router;