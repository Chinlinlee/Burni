const mongodb = require("models/mongodb");
const _ = require("lodash");
const { logger } = require("../../utils/log");
const { UpdateService } = require("./services/update.service");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do update] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}]`
    );
    let updateService = new UpdateService(req, res, resourceType);
    let updateResult = await updateService.update();
    if (!updateResult.status)
        return updateService.doFailureResponse(updateResult.result, updateResult.code);
        
    return updateService.doSuccessResponse(updateResult);
};
