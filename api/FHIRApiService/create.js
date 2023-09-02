const mongodb = require("models/mongodb");
const uuid = require("uuid");
const _ = require("lodash");
const { getNotExistReferenceList } = require("../apiService");
const FHIR = require("fhir").Fhir;
const { validateContainedList } = require("./validateContained");
const { renameCollectionFieldName } = require("../apiService");
const { logger } = require("../../utils/log");
const path = require("path");
const {
    issue,
    OperationOutcome,
    handleError
} = require("../../models/FHIR/httpMessage");
const { CreateService } = require('./services/create.service');

const responseFunc = {
    /**
     *
     * @param {Object} doc
     * @param {import('express').Request} req express request
     * @param {import('express').Response} res express response
     * @param {string} resourceType resource type
     * @param {function} doResCallback callback function
     * @returns
     */
    true: (doc, req, res, resourceType, doResCallback) => {
        let reqBaseUrl = `${req.protocol}://${req.get("host")}/`;
        let fullAbsoluteUrl = new URL(req.originalUrl, reqBaseUrl).href;
        res.set("Location", fullAbsoluteUrl);
        res.append("Last-Modified", new Date().toUTCString());
        logger.info(
            `[Info: create id: ${doc.id} successfully] [Resource Type: ${resourceType}]`
        );
        return doResCallback(201, doc);
    },
    /**
     *
     * @param {Object} err
     * @param {import('express').Request} req express request
     * @param {import('express').Response} res express response
     * @param {string} resourceType resource type
     * @param {function} doResCallback callback function
     * @returns
     */
    false: (err, req, res, resourceType, doResCallback) => {
        let operationOutcomeMessage;
        if (err.message.code == 11000) {
            operationOutcomeMessage = {
                code: 409,
                msg: handleError.duplicate(err.message)
            };
        } else if (err.stack.includes("ValidationError")) {
            let operationOutcomeError = new OperationOutcome([]);
            for (let errorKey in err.errors) {
                let error = err.errors[errorKey];
                let message = _.get(error, "message", `${error} invalid`);
                let errorIssue = new issue("error", "invalid", message);
                _.set(errorIssue, "location", [errorKey]);
                operationOutcomeError.issue.push(errorIssue);
            }
            operationOutcomeMessage = {
                code: 400,
                msg: operationOutcomeError
            };
        } else if (err.stack.includes("stored by resource")) {
            operationOutcomeMessage = {
                code: 400,
                msg: handleError.processing(err.message)
            };
        } else {
            operationOutcomeMessage = {
                code: 500,
                msg: handleError.exception(err.message)
            };
        }
        logger.error(
            `[Error: ${JSON.stringify(
                operationOutcomeMessage
            )}] [Resource Type: ${resourceType}]`
        );
        return doResCallback(
            operationOutcomeMessage.code,
            operationOutcomeMessage.msg
        );
    }
};
/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function(req, res , resourceType) {
    logger.info(`[Info: do create] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader("content-type")}]`);
    let createService = new CreateService(req, res, resourceType);
    let { status, code, result } = await createService.create();
    
    if (!status) {
        return createService.doFailureResponse(result, code);
    }

    return createService.doSuccessResponse(result);
};