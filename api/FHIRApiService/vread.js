const mongodb = require("models/mongodb");
const { handleError } = require("../../models/FHIR/httpMessage");
const FHIR = require("fhir").Fhir;
const { logger } = require("@root/utils/log");
const path = require("path");
const { VReadService } = require("./services/vread.service");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do vread] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}]`
    );

    let vReadService = new VReadService(req, res, resourceType);
    let { status, code, result } = await vReadService.versionRead();
    if (!status) {
        logger.error(`API ${process.env.FHIRSERVER_APIPATH}/${resourceType}/:id error occurred, ${JSON.stringify(result, Object.getOwnPropertyNames(result))}`);
        return vReadService.doResponse(code, result);
    }

    return vReadService.doSuccessResponse(result);
};
