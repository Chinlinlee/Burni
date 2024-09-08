const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "SubstanceProtein.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceProtein'));
}

if (_.get(config, "SubstanceProtein.interaction.read", true)) {
    router.get('/:id', require('./controller/getSubstanceProteinById'));
}

if (_.get(config, "SubstanceProtein.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getSubstanceProteinHistory'));
}

if (_.get(config, "SubstanceProtein.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getSubstanceProteinHistoryById'));
}

if (_.get(config, "SubstanceProtein.interaction.create", true)) {
    router.post('/', require('./controller/postSubstanceProtein'));
}

router.post('/([\$])validate', require('./controller/postSubstanceProteinValidate'));

if (_.get(config, "SubstanceProtein.interaction.update", true)) {
    router.put('/:id', require("./controller/putSubstanceProtein"));
}

if (_.get(config, "SubstanceProtein.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteSubstanceProtein"));
    router.delete('/', require("./controller/condition-deleteSubstanceProtein"));
}

module.exports = router;