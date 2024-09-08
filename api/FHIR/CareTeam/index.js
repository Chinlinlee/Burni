const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "CareTeam.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCareTeam'));
}

if (_.get(config, "CareTeam.interaction.read", true)) {
    router.get('/:id', require('./controller/getCareTeamById'));
}

if (_.get(config, "CareTeam.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getCareTeamHistory'));
}

if (_.get(config, "CareTeam.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getCareTeamHistoryById'));
}

if (_.get(config, "CareTeam.interaction.create", true)) {
    router.post('/', require('./controller/postCareTeam'));
}

router.post('/([\$])validate', require('./controller/postCareTeamValidate'));

if (_.get(config, "CareTeam.interaction.update", true)) {
    router.put('/:id', require("./controller/putCareTeam"));
}

if (_.get(config, "CareTeam.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteCareTeam"));
    router.delete('/', require("./controller/condition-deleteCareTeam"));
}

module.exports = router;