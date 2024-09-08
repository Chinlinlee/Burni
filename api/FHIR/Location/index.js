const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Location.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLocation'));
}

if (_.get(config, "Location.interaction.read", true)) {
    router.get('/:id', require('./controller/getLocationById'));
}

if (_.get(config, "Location.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getLocationHistory'));
}

if (_.get(config, "Location.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getLocationHistoryById'));
}

if (_.get(config, "Location.interaction.create", true)) {
    router.post('/', require('./controller/postLocation'));
}

router.post('/([\$])validate', require('./controller/postLocationValidate'));

if (_.get(config, "Location.interaction.update", true)) {
    router.put('/:id', require("./controller/putLocation"));
}

if (_.get(config, "Location.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteLocation"));
    router.delete('/', require("./controller/condition-deleteLocation"));
}

module.exports = router;