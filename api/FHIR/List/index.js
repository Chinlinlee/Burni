const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "List.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getList'));
}

if (_.get(config, "List.interaction.read", true)) {
    router.get('/:id', require('./controller/getListById'));
}

if (_.get(config, "List.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getListHistory'));
}

if (_.get(config, "List.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getListHistoryById'));
}

if (_.get(config, "List.interaction.create", true)) {
    router.post('/', require('./controller/postList'));
}

router.post('/([\$])validate', require('./controller/postListValidate'));

if (_.get(config, "List.interaction.update", true)) {
    router.put('/:id', require("./controller/putList"));
}

if (_.get(config, "List.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteList"));
    router.delete('/', require("./controller/condition-deleteList"));
}

module.exports = router;