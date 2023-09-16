const _ = require("lodash");

const { logger } = require("../../utils/log");
const { HistoryService } = require("./services/history.service");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(
        `[Info: do history-instance by id, id: ${
            req.params.id
        }] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader(
            "content-type"
        )}] [Url-SearchParam: ${req.url}] `
    );

    let historyService = new HistoryService(req, res, resourceType);

    let { status, code, result } = await historyService.doHistory();

    if (!status) {
        return historyService.doFailureResponse(result, code);
    }

    return historyService.doSuccessResponse(result);
};
