const _ = require("lodash");
const { logger } = require("../../../utils/log");
const { doRes } = require("../../../utils/response");
const { handleError } = require("../../../models/FHIR/httpMessage");
const { FhirReferenceChecker } = require("@root/utils/fhir-ref-checker");


/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
async function checkReferenceMiddleware(req, res, next) {
    let resourceType = _.get(req.params, "resourceType");
    let resourceData = _.cloneDeep(req.body);
    let fhirReferenceChecker = new FhirReferenceChecker(resourceData);
    let checkReferenceRes = await fhirReferenceChecker.checkReference();
    if (!checkReferenceRes.status) {
        let notExistReferenceList = fhirReferenceChecker.getNotExistReferenceList(checkReferenceRes);
        let operationOutcomeError = handleError.processing(
            `The reference not found : ${_.map(
                notExistReferenceList,
                "value"
            ).join(",")}`
        );
        _.set(
            operationOutcomeError,
            "issue.0.location",
            _.map(notExistReferenceList, "path")
        );
        logger.error(
            `[Error: ${JSON.stringify(
                operationOutcomeError
            )}] [Resource Type: ${resourceType}]`
        );
        return doRes(req, res, 400, operationOutcomeError);
    }
    next();
}

module.exports.checkReferenceMiddleware = checkReferenceMiddleware;
