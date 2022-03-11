const _ = require('lodash');
const FHIR = require('fhir').Fhir;
const mongodb = require('../../models/mongodb');
const { handleError, OperationOutcome, issue} = require('../../models/FHIR/httpMessage');
const { validateByProfile, validateByMetaProfile } = require('../../models/FHIR/fhir-validator');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);

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
        logger.error(`[Error: ${errorStr}] [From-File: ${PWD_FILENAME}]`);
        let operationOutcomeError = handleError.exception(errorStr);
        return doRes(500, operationOutcomeError);
    }
};

/**
 * 
 * @param {import('express').Request} req 
 * @param {string} resourceType 
 */
async function getValidateResult(req, resourceType) {
    try {
        let profileUrl = _.get(req.query, "profile");
        let metaProfiles = _.get(req.body, "meta.profile", false);
        if (profileUrl) {
            return await validateByProfile(profileUrl, req.body);
        } else if (metaProfiles) {
            return await validateByMetaProfile(req.body);
        }
        let validation = await mongodb[resourceType].validate(req.body);
    } catch(e) {
        let name = _.get(e, "name");
        if (name === "ValidationError") {
            let operationOutcomeError = new OperationOutcome([]);
            for (let errorKey in e.errors) {
                let error = e.errors[errorKey];
                let message = _.get(error, "message", `${error} invalid`);
                let errorIssue = new issue("error", "invalid", message);
                _.set(errorIssue, "Location", [errorKey]);
                operationOutcomeError.issue.push(errorIssue);
            }
            return operationOutcomeError;
        }
        throw e;
    }
}