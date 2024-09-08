const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CatalogEntry.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCatalogEntry'));
}

if (_.get(config, "CatalogEntry.interaction.read", true)) {
    router.get('/:id', require('./controller/getCatalogEntryById'));
}

if (_.get(config, "CatalogEntry.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCatalogEntryHistory'));
}

if (_.get(config, "CatalogEntry.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCatalogEntryHistoryById'));
}

if (_.get(config, "CatalogEntry.interaction.create", true)) {
    router.post('/', require('./controller/postCatalogEntry'));
}

router.post('/([\$])validate', require('./controller/postCatalogEntryValidate'));

if (_.get(config, "CatalogEntry.interaction.update", true)) {
    router.put('/:id', require("./controller/putCatalogEntry"));
}

if (_.get(config, "CatalogEntry.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCatalogEntry"));
    router.delete('/', require("./controller/condition-deleteCatalogEntry"));
}

module.exports = router;