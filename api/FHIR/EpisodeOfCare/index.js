const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "EpisodeOfCare.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEpisodeOfCare'));
}

if (_.get(config, "EpisodeOfCare.interaction.read", true)) {
    router.get('/:id', require('./controller/getEpisodeOfCareById'));
}

if (_.get(config, "EpisodeOfCare.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getEpisodeOfCareHistory'));
}

if (_.get(config, "EpisodeOfCare.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getEpisodeOfCareHistoryById'));
}

if (_.get(config, "EpisodeOfCare.interaction.create", true)) {
    router.post('/', require('./controller/postEpisodeOfCare'));
}

router.post('/([\$])validate', require('./controller/postEpisodeOfCareValidate'));

if (_.get(config, "EpisodeOfCare.interaction.update", true)) {
    router.put('/:id', require("./controller/putEpisodeOfCare"));
}

if (_.get(config, "EpisodeOfCare.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteEpisodeOfCare"));
    router.delete('/', require("./controller/condition-deleteEpisodeOfCare"));
}

module.exports = router;