const express = require('express');
const router = express.Router();
const joi = require('joi');
const {
    FHIRValidateParams
} = require('api/validator');
const FHIR = require('../../../models/FHIR/fhir/fhir').Fhir;
const {
    handleError
} = require('../../../models/FHIR/httpMessage');
const _ = require('lodash');

function setFormatWhenQuery(req, res) {
    let format = _.get(req, "query._format");
    if (format && format.includes("xml")) {
        res.set('Content-Type', 'application/fhir+xml');
    } else if (format && format.includes("json")) {
        res.set('Content-Type', 'application/fhir+json');
    }
    delete req['query']['_format'];
}

router.use((req, res, next) => {
    try {
        if (req.headers["content-type"]) {
            if (req.headers["content-type"].includes("xml")) {
                res.set('Content-Type', 'application/fhir+xml');
                if (req.method == "POST") {
                    let Fhir = new FHIR();
                    req.body = Fhir.xmlToObj(req.body);
                }
            }
        }
        _.get(req.headers, "accept") ? "" : (() => {
            _.get(req.headers, "content-type") ? _.set(req.headers, "accept", _.get(req.headers, "content-type")) : _.set(req.headers, "accept", "application/fhir+json");
        })();
        if (req.headers.accept.includes("xml")) {
            res.set('Content-Type', 'application/fhir+xml');
        } else {
            res.set('Content-Type', 'application/fhir+json');
        }
        setFormatWhenQuery(req, res);
        next();
    } catch (e) {
        return res.send(handleError.exception(e));
    }
});

router.get('/', FHIRValidateParams({
    "_offset": joi.number().integer(),
    "_count": joi.number().integer()
}, "query", {
    allowUnknown: true
}), require('./controller/getPatient'));

router.get('/:id', require('./controller/getPatientById'));

router.get('/:id/_history', FHIRValidateParams({
    "_offset": joi.number().integer(),
    "_count": joi.number().integer()
}, "query", {
    allowUnknown: true
}), require('./controller/getPatientHistory'));

router.get('/:id/_history/:version', require('./controller/getPatientHistoryById'));

router.post('/', require('./controller/postPatient'));

//router.post('/([\$])validate', require('./controller/postPatientValidate'));

router.put('/:id', require("./controller/putPatient"));

router.delete('/:id', require("./controller/deletePatient"));
module.exports = router;