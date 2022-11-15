const mongodb = require('models/mongodb');
const uuid = require('uuid');
const _ = require('lodash');
const { getNotExistReferenceList } = require('../apiService');
const FHIR = require('fhir').Fhir;
const validateContained = require('./validateContained');
const { renameCollectionFieldName } = require("../apiService");
const { logger } = require('../../utils/log');
const path = require('path');
const {
    issue,
    OperationOutcome,
    handleError
} = require("../../models/FHIR/httpMessage");

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
    "true": (doc, req, res, resourceType, doResCallback) => {
        let reqBaseUrl = `${req.protocol}://${req.get('host')}/`;
        let fullAbsoluteUrl = new URL(req.originalUrl, reqBaseUrl).href;
        res.set("Location", fullAbsoluteUrl);
        res.append("Last-Modified", (new Date()).toUTCString());
        logger.info(`[Info: create id: ${doc.id} successfully] [Resource Type: ${resourceType}]`);
        return doResCallback(201 , doc);
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
    "false": (err, req, res, resourceType, doResCallback) => {
        let operationOutcomeMessage;
        if (err.message.code == 11000) {
            operationOutcomeMessage = {
                code : 409 ,
                msg : handleError.duplicate(err.message)
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
                code : 400 ,
                msg : operationOutcomeError
            };

        } else if (err.stack.includes("stored by resource")) {
            operationOutcomeMessage = {
                code : 400 ,
                msg : handleError.processing(err.message)
            };
        } else {
            operationOutcomeMessage = {
                code : 500 ,
                msg : handleError.exception(err.message)
            };
        }
        logger.error(`[Error: ${JSON.stringify(operationOutcomeMessage)}] [Resource Type: ${resourceType}]`);
        return doResCallback(operationOutcomeMessage.code , operationOutcomeMessage.msg);
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
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item._doc);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    try {
        let insertData = req.body;
        let cloneInsertData = _.cloneDeep(insertData);
        if (_.get(insertData, "contained")) {
            let containedResources = _.get(insertData, "contained");
            for (let index in containedResources) {
                let resource = containedResources[index];
                let validation = await validateContained(resource, index);
                if (!validation.status) {
                    let operationOutcomeError = handleError.processing(`The resource in contained error. ${validation.message}`);
                    logger.error(`[Error: ${JSON.stringify(operationOutcomeError)}] [Resource Type: ${resourceType}]`);
                    return doRes(400, operationOutcomeError);
                }
            }
        }

        // Validate user request body
        if (process.env.ENABLE_VALIDATOR === "true") {
            let { validateResource } = require("../../utils/validator/processor");
            let validationResult = await validateResource(req.body);

            if (validationResult.isError) return doRes(422, validationResult.message);
        }

        let [status, doc] = await doInsertData(cloneInsertData, resourceType);
        return responseFunc[status](doc, req, res, resourceType, doRes);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500 , operationOutcomeError);
    }
};

async function doInsertData(insertData , resourceType) {
    try {
        renameCollectionFieldName(insertData);
        insertData.id = uuid.v4();
        let insertDataObject = new mongodb[resourceType](insertData);
        let doc = await insertDataObject.save();
        return [true, doc.getFHIRField()];
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}]`);
        return [false , e];
    }
}