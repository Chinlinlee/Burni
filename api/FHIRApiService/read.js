const { ReadService } = require("./services/read.service");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    let readService = new ReadService(req, res, resourceType);
    let {status, code, result} = await readService.read();
    if (!status) {
        return readService.doFailureResponse(result, code);
    }

    return readService.doSuccessResponse(result);
};
