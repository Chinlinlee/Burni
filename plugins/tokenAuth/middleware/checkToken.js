const _ = require("lodash");
const user = require("../api/user/service/user.service");
const { logger } = require("../../../utils/log");
const FHIR = require("fhir").Fhir;
const {
    handleError
} = require('../../../models/FHIR/httpMessage');

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {string} code 
 * @param {Object} item 
 * @returns 
 */
let doRes = function (req, res, code, item) {
    if (req.headers.accept.includes("xml")) {
        let fhir = new FHIR();
        let xmlItem = fhir.objToXml(item);
        return res.status(code).send(xmlItem);
    }
    return res.status(code).send(item);
};

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
