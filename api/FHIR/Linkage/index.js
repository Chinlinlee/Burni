const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Linkage.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLinkage'));
}

if (_.get(config, "Linkage.interaction.read", true)) {
    router.get('/:id', require('./controller/getLinkageById'));
}

if (_.get(config, "Linkage.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLinkageHistory'));
}

if (_.get(config, "Linkage.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getLinkageHistoryById'));
}

if (_.get(config, "Linkage.interaction.create", true)) {
    router.post('/', require('./controller/postLinkage'));
}

router.post('/([\$])validate', require('./controller/postLinkageValidate'));

if (_.get(config, "Linkage.interaction.update", true)) {
    router.put('/:id', require("./controller/putLinkage"));
}

if (_.get(config, "Linkage.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteLinkage"));
    router.delete('/', require("./controller/condition-deleteLinkage"));
}

module.exports = router;