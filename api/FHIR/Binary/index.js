const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Binary.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBinary'));
}

if (_.get(config, "Binary.interaction.read", true)) {
    router.get('/:id', require('./controller/getBinaryById'));
}

if (_.get(config, "Binary.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBinaryHistory'));
}

if (_.get(config, "Binary.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBinaryHistoryById'));
}

if (_.get(config, "Binary.interaction.create", true)) {
    router.post('/', require('./controller/postBinary'));
}

router.post('/([\$])validate', require('./controller/postBinaryValidate'));

if (_.get(config, "Binary.interaction.update", true)) {
    router.put('/:id', require("./controller/putBinary"));
}

if (_.get(config, "Binary.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBinary"));
    router.delete('/', require("./controller/condition-deleteBinary"));
}

module.exports = router;