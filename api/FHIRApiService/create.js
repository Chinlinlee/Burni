const mongodb = require('models/mongodb');
const {
    handleError
} = require('../../models/FHIR/httpMessage');
const uuid = require('uuid');
const _ = require('lodash');
const { checkReference, getNotExistReferenceList } = require('../apiService');
const FHIR = require('fhir').Fhir;
const user = require('../APIservices/user.service');
const validateContained = require('./validateContained');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);

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
        logger.info(`[Info: create id: ${doc.id} successfully] [Resource Type: ${resourceType}] [From-file: ${PWD_FILENAME}]`);
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
            operationOutcomeMessage = {
                code : 400 ,
                msg : handleError.processing(err.message)
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
        logger.error(`[Error: ${JSON.stringify(operationOutcomeMessage)}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
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
    logger.info(`[Info: do create] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}] [Content-Type: ${res.getHeader("content-type")}]`);
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!await user.checkTokenPermission(req, resourceType, "create")) {
        logger.warn(`[Warn: Request token doesn't have permission with this API] [From-File: ${PWD_FILENAME}] [From-IP: ${req.socket.remoteAddress}]`);
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    try {
        let insertData = req.body;
        if (_.get(insertData, "contained")) {
            let containedResources = _.get(insertData, "contained");
            for (let index in containedResources) {
                let resource = containedResources[index];
                let validation = await validateContained(resource, index);
                if (!validation.status) {
                    let operationOutcomeError = handleError.processing(`The resource in contained error. ${validation.message}`);
                    logger.error(`[Error: ${JSON.stringify(operationOutcomeError)}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
                    return doRes(400, operationOutcomeError);
                }
            }
        }
        if (process.env.ENABLE_CHECK_REFERENCE == "true") {
            let checkReferenceRes = await checkReference(insertData);
            if (!checkReferenceRes.status) {
                let notExistReferenceList = getNotExistReferenceList(checkReferenceRes);
                let operationOutcomeError = handleError.processing(`The reference not found : ${_.map(notExistReferenceList , "value").join(",")}`);
                _.set(operationOutcomeError , "issue.0.location" , _.map(notExistReferenceList , "path"));
                logger.error(`[Error: ${JSON.stringify(operationOutcomeError)}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
                return doRes(400, operationOutcomeError);
            }
        }
        let [status, doc] = await doInsertData(insertData, resourceType);
        return responseFunc[status](doc, req, res, resourceType, doRes);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500 , operationOutcomeError);
    }
};

async function doInsertData(insertData , resourceType) {
    try {
        delete insertData.text;
        //delete insertData.meta;
        insertData.id = uuid.v4();
        let insertDataObject = new mongodb[resourceType](insertData);
        let doc = await insertDataObject.save();
        return [true, doc.getFHIRField()];
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
        return [false , e];
    }
}