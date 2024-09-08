const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "PaymentNotice.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPaymentNotice'));
}

if (_.get(config, "PaymentNotice.interaction.read", true)) {
    router.get('/:id', require('./controller/getPaymentNoticeById'));
}

if (_.get(config, "PaymentNotice.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPaymentNoticeHistory'));
}

if (_.get(config, "PaymentNotice.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPaymentNoticeHistoryById'));
}

if (_.get(config, "PaymentNotice.interaction.create", true)) {
    router.post('/', require('./controller/postPaymentNotice'));
}

router.post('/([\$])validate', require('./controller/postPaymentNoticeValidate'));

if (_.get(config, "PaymentNotice.interaction.update", true)) {
    router.put('/:id', require("./controller/putPaymentNotice"));
}

if (_.get(config, "PaymentNotice.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePaymentNotice"));
    router.delete('/', require("./controller/condition-deletePaymentNotice"));
}

module.exports = router;