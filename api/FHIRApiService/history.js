const _ = require('lodash');
const mongodb = require('models/mongodb');
const {
    createBundle
} = require('models/FHIR/func');
const FHIR = require('../../models/FHIR/fhir/fhir').Fhir;
const { handleError } = require('../../models/FHIR/httpMessage');
const user = require('../APIservices/user.service');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);

/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {String} resourceType 
 * @returns 
 */
module.exports = async function(req, res, resourceType) {
    logger.info(`[Info: do history-instance by id, id: ${req.params.id}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}] [Content-Type: ${res.getHeader("content-type")}] [Url-SearchParam: ${req.url}] `);
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!await user.checkTokenPermission(req, resourceType, "history")) {
        logger.warn(`[Warn: Request token doesn't have permission with this API] [From-File: ${PWD_FILENAME}] [From-IP: ${req.socket.remoteAddress}]`);
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    let queryParameter = _.cloneDeep(req.query);
    let id = req.params.id;
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    try {
        let docs = await mongodb[`${resourceType}_history`].find({
            id: id
        }).
        limit(paginationLimit).
        skip(paginationSkip).
        sort({
            _id: -1
        }).
        exec();
        docs = docs.map(v => {
            return v.getFHIRBundleField();
        });
        if (docs.length == 0 ) {
            let operationOutcomeNotFound = handleError['not-found'](`id->"${id}" in resource "${resourceType}" not found`);
            return doRes(404, operationOutcomeNotFound);
        }
        let count = await mongodb[`${resourceType}_history`].countDocuments({
            id: id
        });
        let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, resourceType, {
            type: "history"
        });
        res.header('Last-Modified', new Date().toUTCString());
        return doRes(200, bundle);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr})}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500, operationOutcomeError);
    }
};