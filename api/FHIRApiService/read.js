const mongodb = require('models/mongodb');
const {
    handleError
} = require('../../models/FHIR/httpMessage');
const FHIR = require('fhir').Fhir;
const { logger } = require('../../utils/log');
const path = require('path');

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function (req , res , resourceType) {
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let id = req.params.id;
    logger.info(`[Info: do read] [Resource Type: ${resourceType}] [ID: ${id}] [Content-Type: ${res.getHeader("content-type")}]`);
    try {
        let docs = await mongodb[resourceType].findOne({
            id: id
        }).exec();
        if (docs) {
            let responseDoc = docs.getFHIRField();
            res.header('Last-Modified', new Date(responseDoc.meta.lastUpdated).toUTCString());
            return doRes(200, responseDoc);
        }
        let errorMessage = `not found ${resourceType}/${id}`;
        logger.warn(`[Warn: ${errorMessage}] [Resource-Type: ${resourceType}]`);
        let operationOutcomeError = handleError.exception(errorMessage);
        return doRes(404, operationOutcomeError);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500, operationOutcomeError);
    }
};