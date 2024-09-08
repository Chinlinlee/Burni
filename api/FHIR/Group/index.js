const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Group.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGroup'));
}

if (_.get(config, "Group.interaction.read", true)) {
    router.get('/:id', require('./controller/getGroupById'));
}

if (_.get(config, "Group.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getGroupHistory'));
}

if (_.get(config, "Group.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getGroupHistoryById'));
}

if (_.get(config, "Group.interaction.create", true)) {
    router.post('/', require('./controller/postGroup'));
}

router.post('/([\$])validate', require('./controller/postGroupValidate'));

if (_.get(config, "Group.interaction.update", true)) {
    router.put('/:id', require("./controller/putGroup"));
}

if (_.get(config, "Group.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteGroup"));
    router.delete('/', require("./controller/condition-deleteGroup"));
}

module.exports = router;