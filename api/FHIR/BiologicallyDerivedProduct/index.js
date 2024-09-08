const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "BiologicallyDerivedProduct.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBiologicallyDerivedProduct'));
}

if (_.get(config, "BiologicallyDerivedProduct.interaction.read", true)) {
    router.get('/:id', require('./controller/getBiologicallyDerivedProductById'));
}

if (_.get(config, "BiologicallyDerivedProduct.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getBiologicallyDerivedProductHistory'));
}

if (_.get(config, "BiologicallyDerivedProduct.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getBiologicallyDerivedProductHistoryById'));
}

if (_.get(config, "BiologicallyDerivedProduct.interaction.create", true)) {
    router.post('/', require('./controller/postBiologicallyDerivedProduct'));
}

router.post('/([\$])validate', require('./controller/postBiologicallyDerivedProductValidate'));

if (_.get(config, "BiologicallyDerivedProduct.interaction.update", true)) {
    router.put('/:id', require("./controller/putBiologicallyDerivedProduct"));
}

if (_.get(config, "BiologicallyDerivedProduct.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteBiologicallyDerivedProduct"));
    router.delete('/', require("./controller/condition-deleteBiologicallyDerivedProduct"));
}

module.exports = router;