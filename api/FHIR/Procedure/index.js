const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "Procedure.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getProcedure'));
}

if (_.get(config, "Procedure.interaction.read", true)) {
    router.get('/:id', require('./controller/getProcedureById'));
}

if (_.get(config, "Procedure.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getProcedureHistory'));
}

if (_.get(config, "Procedure.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getProcedureHistoryById'));
}

if (_.get(config, "Procedure.interaction.create", true)) {
    router.post('/', require('./controller/postProcedure'));
}

router.post('/([\$])validate', require('./controller/postProcedureValidate'));

if (_.get(config, "Procedure.interaction.update", true)) {
    router.put('/:id', require("./controller/putProcedure"));
}

if (_.get(config, "Procedure.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteProcedure"));
    router.delete('/', require("./controller/condition-deleteProcedure"));
}

module.exports = router;