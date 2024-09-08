const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Subscription.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubscription'));
}

if (_.get(config, "Subscription.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubscriptionById'));
}

if (_.get(config, "Subscription.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubscriptionHistory'));
}

if (_.get(config, "Subscription.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubscriptionHistoryById'));
}

if (_.get(config, "Subscription.interaction.create", true)) {
    router.post('/', require('./controller/postSubscription'));
}

router.post('/([\$])validate', require('./controller/postSubscriptionValidate'));

if (_.get(config, "Subscription.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubscription"));
}

if (_.get(config, "Subscription.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubscription"));
    router.delete('/', require("./controller/condition-deleteSubscription"));
}

module.exports = router;