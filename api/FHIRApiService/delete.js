const mongodb = require("models/mongodb");
const _ = require("lodash");
const { logger } = require("../../utils/log");
const { DeleteService } = require("./services/delete.service");


/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do delete by id, id: ${
            req.params.id
        }] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}]`
    );

    let deleteService = new DeleteService(req, res, resourceType);
    let { status, code, result } = await deleteService.delete();

    if (!status) {
        return deleteService.doFailureResponse(result, code);
    }

    return deleteService.doSuccessResponse(result);

};
