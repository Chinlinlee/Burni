const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Person.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPerson'));
}

if (_.get(config, "Person.interaction.read", true)) {
    router.get('/:id', require('./controller/getPersonById'));
}

if (_.get(config, "Person.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getPersonHistory'));
}

if (_.get(config, "Person.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getPersonHistoryById'));
}

if (_.get(config, "Person.interaction.create", true)) {
    router.post('/', require('./controller/postPerson'));
}

router.post('/([\$])validate', require('./controller/postPersonValidate'));

if (_.get(config, "Person.interaction.update", true)) {
    router.put('/:id', require("./controller/putPerson"));
}

if (_.get(config, "Person.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deletePerson"));
    router.delete('/', require("./controller/condition-deletePerson"));
}

module.exports = router;