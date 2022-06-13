const _ = require("lodash");
const user = require("../api/user/service/user.service");
const { logger } = require("../../../utils/log");
const { doRes } = require("../../../utils/response");
const {
    handleError
} = require('../../../models/FHIR/httpMessage');

/**
 * 
 * @param {import("express").Request} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
module.exports.hasPermission = async function(req, res, next) {
    let resourceType = _.get(req.params, "resourceType", "");
    let hasPermission = await user.checkTokenPermission(req, resourceType, "delete");
    if (!hasPermission) {
        logger.warn(`[Warn: Request token doesn't have permission with this API] [From-IP: ${req.socket.remoteAddress}]`);
        return doRes(req, res, 403, handleError.forbidden("Your token doesn't have permission with this API"));
    }
    next();
};
