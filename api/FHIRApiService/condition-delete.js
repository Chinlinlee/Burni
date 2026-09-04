const _ = require("lodash");
const mongodb = require("models/mongodb");
const { handleError } = require("../../models/FHIR/httpMessage");
const FHIR = require("fhir").Fhir;
const { isRealObject } = require("../apiService");
const { logger } = require("../../utils/log");
const {
    SearchParameterCreator,
    UnknownSearchParameterError,
    InvalidSearchParameterValueError,
    RelationLimitSearchParameterError
} = require("./search/searchParameterCreator");

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do condition-delete] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}] [Url-SearchParam: ${req.url}] `
    );
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip =
        queryParameter["_offset"] == undefined ? 0 : queryParameter["_offset"];
    let paginationLimit =
        queryParameter["_count"] == undefined ? 100 : queryParameter["_count"];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter["_count"];
    delete queryParameter["_offset"];
    Object.keys(queryParameter).forEach((key) => {
        if (!queryParameter[key] || isRealObject(queryParameter[key])) {
            delete queryParameter[key];
        }
    });
    try {
        const searchParameterCreator = new SearchParameterCreator({
            resourceType,
            query: queryParameter
        });
        queryParameter = await searchParameterCreator.create();
    } catch (e) {
        if (
            e instanceof UnknownSearchParameterError ||
            e instanceof InvalidSearchParameterValueError ||
            e instanceof RelationLimitSearchParameterError
        ) {
            logger.error(
                `[Error: ${e.message}] [Resource Type: ${resourceType}]`
            );
            return doRes(400, handleError.processing(e.message));
        }
        logger.error(
            `[Error: Search parameter processing failed] [Resource Type: ${resourceType}] [${e}]`
        );
        return doRes(400, handleError.processing("Unknown search parameter or value"));
    }
    if (queryParameter.isChain) {
        return doRes(
            400,
            handleError.processing("Chained search is not supported for conditional delete")
        );
    }
    try {
        let deletion = await mongodb[resourceType].deleteMany(queryParameter);
        res.header("Last-Modified", new Date().toUTCString());
        let info = handleError.informational(
            `delete successfully, deleted count : ${deletion.deletedCount}`
        );
        return doRes(200, info);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}]`);
        let operationOutcomeError = handleError.exception(e);
        return doRes(500, operationOutcomeError);
    }
};
