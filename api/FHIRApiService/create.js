const { logger } = require("../../utils/log");
const { CreateService } = require('./services/create.service');

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