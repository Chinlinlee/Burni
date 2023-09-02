const mongoose = require("mongoose");
const FHIR = require("fhir").FHIR;
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
        this.request = req;
        this.response = res;
        this.resourceType = resourceType;
    }

    doSuccessResponse(resource) {
        return this.doResponse(200, resource);
    }

    doFailureResponse(err, code) {
        return this.doResponse(code, err);
    }

    doResponse(code, item) {
        if (this.response.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item._doc);
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