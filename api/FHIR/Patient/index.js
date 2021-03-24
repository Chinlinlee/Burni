const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    validateParams
} = require('api/validator');

router.use((req, res, next) => {
    res.set('Content-Type', 'application/fhir+json');
    next();
});
router.get('/', validateParams({
    "_offset": joi.number().integer(),
    "_count": joi.number().integer()
}, "query", {
    allowUnknown: true
}), require('./controller/getPatient'));

router.get('/:id', require('./controller/getPatientById'));

router.get('/:id/_history', validateParams({
    "_offset": joi.number().integer(),
    "_count": joi.number().integer()
}, "query", {
    allowUnknown: true
}), require('./controller/getPatientHistory'));

router.get('/:id/_history/:version', require('./controller/getPatientHistoryById'));

router.post('/', require('./controller/postPatient'));

router.put('/:id', require("./controller/putPatient"));

router.delete('/:id', require("./controller/deletePatient"));
module.exports = router;