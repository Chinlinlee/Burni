const _ = require("lodash");
const mongoose = require("mongoose");

const {
    getDeleteMessage,
    handleError
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

    static async deleteResourceById(resourceType, id) {
        let deletedDoc = await mongoose.model(resourceType).findOneAndDelete(
            {
                id: id
            }
        );

        return {
            success: true,
            code: 200,
            result: deletedDoc
        };
    }
}

module.exports.DeleteService = DeleteService;