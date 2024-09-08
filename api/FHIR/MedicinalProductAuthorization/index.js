const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductAuthorization.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductAuthorization'));
}

if (_.get(config, "MedicinalProductAuthorization.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductAuthorizationById'));
}

if (_.get(config, "MedicinalProductAuthorization.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductAuthorizationHistory'));
}

if (_.get(config, "MedicinalProductAuthorization.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductAuthorizationHistoryById'));
}

if (_.get(config, "MedicinalProductAuthorization.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductAuthorization'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductAuthorizationValidate'));

if (_.get(config, "MedicinalProductAuthorization.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductAuthorization"));
}

if (_.get(config, "MedicinalProductAuthorization.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductAuthorization"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductAuthorization"));
}

module.exports = router;