const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Slot.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSlot'));
}

if (_.get(config, "Slot.interaction.read", true)) {
    router.get('/:id', require('./controller/getSlotById'));
}

if (_.get(config, "Slot.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSlotHistory'));
}

if (_.get(config, "Slot.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSlotHistoryById'));
}

if (_.get(config, "Slot.interaction.create", true)) {
    router.post('/', require('./controller/postSlot'));
}

router.post('/([\$])validate', require('./controller/postSlotValidate'));

if (_.get(config, "Slot.interaction.update", true)) {
    router.put('/:id', require("./controller/putSlot"));
}

if (_.get(config, "Slot.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSlot"));
    router.delete('/', require("./controller/condition-deleteSlot"));
}

module.exports = router;