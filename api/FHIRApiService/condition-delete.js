const _ = require('lodash');
const mongodb = require('models/mongodb');
const {
    handleError
} = require('../../models/FHIR/httpMessage');
const FHIR = require('fhir').Fhir;
const { isRealObject } = require('../apiService');
const user = require('../APIservices/user.service');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string} resourceType 
 * @param {*} paramsSearch 
 * @returns 
 */
module.exports = async function(req, res, resourceType, paramsSearch) {
    logger.info(`[Info: do condition-delete] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}] [Content-Type: ${res.getHeader("content-type")}] [Url-SearchParam: ${req.url}] `);
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!await user.checkTokenPermission(req, resourceType, "delete")) {
        logger.warn(`[Warn: Request token doesn't have permission with this API] [From-File: ${PWD_FILENAME}] [From-IP: ${req.socket.remoteAddress}]`);
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    Object.keys(queryParameter).forEach(key => {
        if (!queryParameter[key] || isRealObject(queryParameter[key])) {
            delete queryParameter[key];
        }
    });
    queryParameter.$and = [];
    for (let key in queryParameter) {
        try {
            paramsSearch[key](queryParameter);
        } catch (e) {
            if (key != "$and") {
                logger.error(`[Error: Unknown search parameter ${key} or value ${queryParameter[key]}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}] [${e}]`);
                return doRes(400 , handleError.processing(`Unknown search parameter ${key} or value ${queryParameter[key]}`));
            }
        }
    }
    if (queryParameter.$and.length == 0) {
        delete queryParameter["$and"];
    }
    try {
        let deletion = await mongodb[resourceType].deleteMany(queryParameter);
        res.header('Last-Modified', new Date().toUTCString());
        let info = handleError.informational(`delete successfully, deleted count : ${deletion.deletedCount}`);
        return doRes(200 , info);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}] [From-File: ${PWD_FILENAME}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500 , operationOutcomeError);
    }
};