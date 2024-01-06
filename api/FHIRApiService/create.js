const mongodb = require("@models/mongodb");
const uuid = require("uuid");
const _ = require("lodash");
const { getNotExistReferenceList } = require("../apiService");
const FHIR = require("fhir").Fhir;
const { validateContainedList } = require("./validateContained");
const { renameCollectionFieldName } = require("../apiService");
const { logger } = require("../../utils/log");
const path = require("path");
const {
    issue,
    OperationOutcome,
    handleError
} = require("../../models/FHIR/httpMessage");
const { CreateService } = require('./services/create.service');

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {String} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    logger.info(`[Info: do create] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader("content-type")}]`);
    let createService = new CreateService(req, res, resourceType);
    let { status, code, result } = await createService.create();

    if (!status) {
        return createService.doFailureResponse(result, code);
    }

    return createService.doSuccessResponse(result);
};