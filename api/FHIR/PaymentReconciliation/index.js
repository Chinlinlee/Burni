const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "PaymentReconciliation.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPaymentReconciliation'));
}

if (_.get(config, "PaymentReconciliation.interaction.read", true)) {
    router.get('/:id', require('./controller/getPaymentReconciliationById'));
}

if (_.get(config, "PaymentReconciliation.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPaymentReconciliationHistory'));
}

if (_.get(config, "PaymentReconciliation.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPaymentReconciliationHistoryById'));
}

if (_.get(config, "PaymentReconciliation.interaction.create", true)) {
    router.post('/', require('./controller/postPaymentReconciliation'));
}

router.post('/([\$])validate', require('./controller/postPaymentReconciliationValidate'));

if (_.get(config, "PaymentReconciliation.interaction.update", true)) {
    router.put('/:id', require("./controller/putPaymentReconciliation"));
}

if (_.get(config, "PaymentReconciliation.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePaymentReconciliation"));
    router.delete('/', require("./controller/condition-deletePaymentReconciliation"));
}

module.exports = router;