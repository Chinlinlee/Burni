const mongoose = require("mongoose");

const { BaseFhirApiService } = require("./base.service");
const { handleError } = require("@models/FHIR/httpMessage");

const { logger } = require("@root/utils/log");


class ReadService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
        this.resourceId = this.request.params.id;
    }

    async read() {
        try {
            let resource = await ReadService.getResourceById(this.resourceType, this.resourceId);

            if (resource) {
                let responseDoc = resource.getFHIRField();
                this.response.header(
                    "Last-Modified",
                    new Date(responseDoc.meta.lastUpdated).toUTCString()
                );
                return {
                    status: true,
                    code: 200,
                    result: responseDoc
                };
            }

            let errorMessage = `not found ${this.resourceType}/${this.resourceId}`;
            logger.warn(`[Warn: ${errorMessage}] [Resource-Type: ${this.resourceType}]`);
            let operationOutcomeError = handleError.exception(errorMessage);
            return {
                status: false,
                code: 404,
                result: operationOutcomeError
            };


        } catch (e) {
            let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
            logger.error(`[Error: ${errorStr}] [Resource Type: ${this.resourceType}]`);
            let operationOutcomeError = handleError.exception(e);
            return {
                status: false,
                code: 500,
                result: operationOutcomeError
            };
        }
    }

    static async getResourceById(resourceType, id) {
        return await mongoose.model(resourceType).findOne({
            id: id
        }).exec();
    }

}

module.exports.ReadService = ReadService;