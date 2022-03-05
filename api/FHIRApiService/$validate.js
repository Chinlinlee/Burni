const _ = require('lodash');
const fetch = require('node-fetch');
const FHIR = require('fhir').Fhir;
const fhirVersions = require('fhir').Versions;
const ParseConformance = require('fhir/parseConformance').ParseConformance;
const { handleError, issue, OperationOutcome } = require('../../models/FHIR/httpMessage');
const { getDeepKeys } = require('../apiService');
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string} resourceType
 * @returns 
 */
module.exports = async function (req, res, resourceType) {
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let operationOutcomeMessage;
    return doRes(400, {
        "resourceType": "OperationOutcome",
        "issue": [
            {
                "severity": "processing",
                "code": "processing",
                "diagnostics": "$validate is not support"
            }
        ]
    });
};