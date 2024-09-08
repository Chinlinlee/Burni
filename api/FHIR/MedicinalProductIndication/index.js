const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const _ = require('lodash');
const config = require('../../../config/config');

if (_.get(config, "MedicinalProductIndication.interaction.search", true)) {
    router.get('/', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer(),
        "_pretty": joi.boolean().default(true),
        "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductIndication'));
}

if (_.get(config, "MedicinalProductIndication.interaction.read", true)) {
    router.get('/:id', require('./controller/getMedicinalProductIndicationById'));
}

if (_.get(config, "MedicinalProductIndication.interaction.history", true)) {
    router.get('/:id/_history', FHIRValidateParams({
        "_offset": joi.number().integer(),
        "_count": joi.number().integer()
    }, "query", {
        allowUnknown: true
    }), require('./controller/getMedicinalProductIndicationHistory'));
}

if (_.get(config, "MedicinalProductIndication.interaction.vread", true)) {
    router.get('/:id/_history/:version', require('./controller/getMedicinalProductIndicationHistoryById'));
}

if (_.get(config, "MedicinalProductIndication.interaction.create", true)) {
    router.post('/', require('./controller/postMedicinalProductIndication'));
}

router.post('/([\$])validate', require('./controller/postMedicinalProductIndicationValidate'));

if (_.get(config, "MedicinalProductIndication.interaction.update", true)) {
    router.put('/:id', require("./controller/putMedicinalProductIndication"));
}

if (_.get(config, "MedicinalProductIndication.interaction.delete", true)) {
    router.delete('/:id', require("./controller/deleteMedicinalProductIndication"));
    router.delete('/', require("./controller/condition-deleteMedicinalProductIndication"));
}

module.exports = router;