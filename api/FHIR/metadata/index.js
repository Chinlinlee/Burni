const express = require('express');
const router = express.Router();
const {
    validateParams
} = require('../../validator');
const Joi = require('joi');
const _ = require('lodash');

router.use((req, res, next) => {
    res.set('Content-Type', 'application/fhir+json');
    next();
});

router.get('/', require('./controller/getMetadata'));

module.exports = router;