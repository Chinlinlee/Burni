
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

class CreateService {
    constructor(req, res, resourceType) {
        this.request = req;
        this.response = res;
        this.resourceType = resourceType;
    }

    async create() {
        try {
            let resource = this.request.body;
            let resourceClone = _.cloneDeep(resource);

            // Validate user request body
            let validation = await this.validateRequestResource(resource);
            if (!validation.status) return validation;

            let { status, result } = await this.insertResource(resourceClone);
            return {
                status,
                code: status ? 201 : 500,
                result
            };
        } catch (e) {
            let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
            logger.error(`[Error: ${errorStr})}] [Resource Type: ${this.resourceType}]`);
            let operationOutcomeError = handleError.exception("Server Error Occurred");
            return {
                status: false,
                code: 500,
                result: operationOutcomeError
            };
        }

    }

    doSuccessResponse(resource) {
        let reqBaseUrl = `${this.request.protocol}://${this.request.get('host')}/`;
        let fullAbsoluteUrl = new URL(this.request.originalUrl, reqBaseUrl).href;
        this.response.set("Location", fullAbsoluteUrl);
        this.response.append("Last-Modified", (new Date()).toUTCString());
        logger.info(`[Info: create id: ${resource.id} successfully] [Resource Type: ${this.resourceType}]`);
        return this.doResponse(201, resource);
    }

    doFailureResponse(err, code) {
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
                msg: handleError.exception(err.message)
            };
        }
        logger.error(`[Error: ${JSON.stringify(operationOutcomeMessage)}] [Resource Type: ${this.resourceType}]`);
        return this.doResponse(operationOutcomeMessage.code, operationOutcomeMessage.msg);
    }

    doResponse(code, item) {
        if (this.response.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item._doc);
            return this.response.status(code).send(xmlItem);
        }
        return this.response.status(code).send(item);
    }

    async insertResource(resource) {
        try {
            renameCollectionFieldName(resource);
            resource.id = uuid.v4();
            let insertDataObject = new mongoose.model(this.resourceType)(resource);
            let doc = await insertDataObject.save();
            return {
                status: true,
                result: doc.getFHIRField()
            };
        } catch (e) {
            let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
            logger.error(`[Error: ${errorStr}] [Resource Type: ${this.resourceType}]`);
            return {
                status: false,
                result: e
            };
        }
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

module.exports.CreateService = CreateService;