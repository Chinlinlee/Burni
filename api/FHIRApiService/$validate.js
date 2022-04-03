const _ = require('lodash');
const FHIR = require('fhir').Fhir;
const mongodb = require('../../models/mongodb');
const { handleError, OperationOutcome, issue} = require('../../models/FHIR/httpMessage');
const { getValidateResult } = require('../../models/FHIR/fhir-validator');
const { logger } = require('../../utils/log');
const path = require('path');

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
    try {
        let operationOutcomeMessage = await getValidateResult(req, resourceType);
        let haveError = (_.get(operationOutcomeMessage, "issue")) ? operationOutcomeMessage.issue.find(v=> v.severity === "error") : false;
        if (haveError) {
            return doRes(412, operationOutcomeMessage);
        }
        return doRes(200, operationOutcomeMessage);
    } catch(e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}]`);
        let operationOutcomeError = handleError.exception(errorStr);
        return doRes(500, operationOutcomeError);
    }
};