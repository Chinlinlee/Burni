const mongoose = require("mongoose");
const FHIR = require("fhir").Fhir;
const _ = require("lodash");
const uuid = require('uuid');

const { renameCollectionFieldName } = require("../../apiService");
const { validateContainedList } = require("../validateContained");
const {
    issue,
    OperationOutcome,
    handleError
} = require("@models/FHIR/httpMessage");

const { logger } = require("@root/utils/log");

class BaseFhirApiService {
    constructor(req, res, resourceType) {
        /** @type { import("express").Request } */
        this.request = req;
        /** @type { import("express").Response } */
        this.response = res;
        /** @type { string } */
        this.resourceType = resourceType;
    }

    doSuccessResponse(resource) {
        return this.doResponse(200, resource);
    }

    doFailureResponse(err, code) {
        return this.doResponse(code, err);
    }

    doResourceChangeFailureResponse(err, code) {
        if (_.get(err, "resourceType", "") === "OperationOutcome")
            return this.doResponse(code, err);

        let operationOutcomeMessage;
        if (err.message.code == 11000) {
            operationOutcomeMessage = {
                code: 409,
                msg: handleError.duplicate(err.message)
            };
        } else if (err.stack.includes("ValidationError")) {

            let operationOutcomeError = new OperationOutcome([]);
            for (let errorKey in err.errors) {
                let error = err.errors[errorKey];
                let message = _.get(error, "message", `${error} invalid`);
                let errorIssue = new issue("error", "invalid", message);
                _.set(errorIssue, "location", [errorKey]);
                operationOutcomeError.issue.push(errorIssue);
            }
            operationOutcomeMessage = {
                code: 400,
                msg: operationOutcomeError
            };

        } else if (err.stack.includes("stored by resource")) {
            operationOutcomeMessage = {
                code: 400,
                msg: handleError.processing(err.message)
            };
        } else {
            operationOutcomeMessage = {
                code: 500,
                msg: handleError.exception("Server Error Occurred")
            };
        }
        logger.error(`[Error: ${JSON.stringify(operationOutcomeMessage)}] [Resource Type: ${this.resourceType}]`);
        return this.doResponse(operationOutcomeMessage.code, operationOutcomeMessage.msg);
    }

    doResponse(code, item) {
        let responseResourceType = _.get(item, "resourceType");
        if (!responseResourceType) {
            item = handleError.processing(item);
        }

        if (this.response.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return this.response.status(code).send(xmlItem);
        }
        return this.response.status(code).send(item);
    }

    async validateRequestResource(resource) {
        // Validate user request body
        if (process.env.ENABLE_VALIDATOR === "true") {
            let { validateResource } = require("@root/utils/validator/processor");
            let validationResult = await validateResource(resource);

            if (validationResult.isError) {
                return {
                    status: false,
                    code: 422,
                    result: validationResult.message
                };
            }
        } else {
            let containedValidation = await validateContainedList(resource);
            if (!containedValidation.status) {
                let operationOutcomeError = handleError.processing(`The resource in contained error. ${containedValidation.message}`);
                logger.error(`[Error: ${JSON.stringify(operationOutcomeError)}] [Resource Type: ${this.resourceType}]`);
                return {
                    status: false,
                    code: 422,
                    result: operationOutcomeError
                };
            }
        }

        return {
            status: true,
            code: 200,
            result: "All OK"
        };
    }
}

module.exports.BaseFhirApiService = BaseFhirApiService;