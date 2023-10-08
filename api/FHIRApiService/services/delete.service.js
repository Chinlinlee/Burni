const _ = require("lodash");
const mongoose = require("mongoose");

const {
    getDeleteMessage,
    handleError,
    FhirWebServiceError
} = require("@models/FHIR/httpMessage");
const { BaseFhirApiService } = require("./base.service");

const { logger } = require("@root/utils/log");

class DeleteService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
        this.resourceId = this.request.params.id;
    }

    async delete() {
        try {
            return await DeleteService.deleteResourceById(this.resourceType, this.resourceId);
        } catch(e) {
            if (e instanceof FhirWebServiceError) {
                return {
                    status: false,
                    code: e.code,
                    result: e.operationOutcome
                };
            }

            return {
                status: false,
                code: 500,
                result: e
            };
        }
    }

    doSuccessResponse(deleteResult) {
        if(!deleteResult.result) {
            let errorMessage = `not found ${this.resourceType}/${this.resourceId}`;
            logger.warn(
                `[Warn: ${errorMessage}] [Resource-Type: ${this.resourceType}]`
            );

            return this.doResponse(404, handleError["not-found"](errorMessage));
        }
        return this.doResponse(200, getDeleteMessage(this.resourceType, this.resourceId));
    }

    async doFailureResponse(err, code) {
        if (_.isString(err) && err.includes("not found")) {
            return this.doResponse(404, handleError["not-found"](err));
        }

        return this.doResponse(code, err);
    }

    static async deleteResourceById(resourceType, id, session=undefined) {
        try {
            let deletedDoc = await mongoose.model(resourceType).findOneAndDelete(
                {
                    id: id
                },
                {
                    session
                }
            );
    
            return {
                success: true,
                code: 200,
                result: deletedDoc
            };
        } catch(e) {
            if (_.isString(e)) {
                if (e.includes("not found")) {
                    throw new FhirWebServiceError(404, e, handleError["not-found"]);
                } else if (e.includes("referenced")) {
                    throw new FhirWebServiceError(400, e, handleError.processing);
                }
            }

            throw e;
        }
    }
}

module.exports.DeleteService = DeleteService;