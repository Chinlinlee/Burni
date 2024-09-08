const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Task.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTask'));
}

if (_.get(config, "Task.interaction.read", true)) {
    router.get('/:id', require('./controller/getTaskById'));
}

if (_.get(config, "Task.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getTaskHistory'));
}

if (_.get(config, "Task.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getTaskHistoryById'));
}

if (_.get(config, "Task.interaction.create", true)) {
    router.post('/', require('./controller/postTask'));
}

router.post('/([\$])validate', require('./controller/postTaskValidate'));

if (_.get(config, "Task.interaction.update", true)) {
    router.put('/:id', require("./controller/putTask"));
}

if (_.get(config, "Task.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteTask"));
    router.delete('/', require("./controller/condition-deleteTask"));
}

module.exports = router;