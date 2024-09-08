const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Invoice.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getInvoice'));
}

if (_.get(config, "Invoice.interaction.read", true)) {
    router.get('/:id', require('./controller/getInvoiceById'));
}

if (_.get(config, "Invoice.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getInvoiceHistory'));
}

if (_.get(config, "Invoice.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getInvoiceHistoryById'));
}

if (_.get(config, "Invoice.interaction.create", true)) {
    router.post('/', require('./controller/postInvoice'));
}

router.post('/([\$])validate', require('./controller/postInvoiceValidate'));

if (_.get(config, "Invoice.interaction.update", true)) {
    router.put('/:id', require("./controller/putInvoice"));
}

if (_.get(config, "Invoice.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteInvoice"));
    router.delete('/', require("./controller/condition-deleteInvoice"));
}

module.exports = router;