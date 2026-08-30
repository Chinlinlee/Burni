const _ = require("lodash");
const mongoose = require("mongoose");


const { renameCollectionFieldName } = require("../../apiService");
const { BaseFhirApiService } = require("./base.service");

const { logger } = require("@root/utils/log");
const { urlJoin } = require("@root/utils/url");

class UpdateService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
        this.resourceId = this.request.params.id;
    }

    async update() {
        try {
            let resource = this.request.body;
            let resourceClone = _.cloneDeep(resource);

            let validation = await BaseFhirApiService.validateRequestResource(resource);
            if (!validation.status) return validation;

            const result = await UpdateService.insertOrUpdateResource(this.resourceType, resourceClone, this.resourceId);
            if (result?.status && this.resourceType === "SearchParameter") {
                const { reloadSearchParameterRegistry } = require("@models/FHIR/searchParameter/runtime/registryLifecycle");
                await reloadSearchParameterRegistry();
            }
            return result;

        } catch (e) {
            const { temporalErrorToWriteFailure } = require("@models/FHIR/temporal");
            const { FhirValidationError } = require("@models/FHIR/httpMessage");
            const temporalFailure = temporalErrorToWriteFailure(e);
            if (temporalFailure) {
                return temporalFailure;
            }
            if (e instanceof FhirValidationError) {
                return {
                    status: false,
                    code: e.code,
                    result: e.operationOutcome
                };
            }
            logger.error(`[Error: ${JSON.stringify(e)}] [Resource Type: ${this.resourceType}]`);
            return {
                status: false,
                code: 500,
                result: e
            };
        }
    }

    doSuccessResponse(resource) {
        let reqBaseUrl = `${this.request.protocol}://${this.request.get("host")}/`;
        let fullAbsoluteUrl = urlJoin(this.request.originalUrl, reqBaseUrl);
        this.response.set("Location", fullAbsoluteUrl);

        this.response.append("Last-Modified", new Date().toUTCString());
        return this.doResponse(resource.code, resource.result);
    }

    doFailureResponse(err, code) {
        this.doResourceChangeFailureResponse(err, code);
    }

    static async insertOrUpdateResource(resourceType, resource, id, session = undefined) {
        let docExist = await UpdateService.isDocExist(resourceType, id);
        if (docExist.status === 1) {
            return await UpdateService.updateResource(resourceType, id, resource, session);
        } else if (docExist.status === 2) {
            return await UpdateService.insertResourceWithId(resourceType, id, resource, session);
        }
    }

    static async updateResource(resourceType, id, resource, session = undefined) {
        delete resource.id;
        resource.id = id;
        const { normalizeResourceTemporals } = require("@models/FHIR/temporal");
        const normalized = normalizeResourceTemporals(resource);
        renameCollectionFieldName(normalized);

        let newDoc = await mongoose.model(resourceType).findOneAndUpdate(
            {
                id: id
            },
            {
                $set: normalized
            },
            {
                new: true,
                rawResult: true,
                runValidators: true,
                session: session
            }
        );

        const updatedDoc = newDoc && typeof newDoc.getFHIRField === "function"
            ? newDoc
            : newDoc.value;

        return {
            status: true,
            code: 200,
            result: updatedDoc.getFHIRField()
        };
    }

    static async insertResourceWithId(resourceType, id, resource, session = undefined) {
        resource.id = id;
        const { normalizeResourceTemporals } = require("@models/FHIR/temporal");
        const normalized = normalizeResourceTemporals(resource);
        renameCollectionFieldName(normalized);
        let resourceInstance = new mongoose.model(resourceType)(normalized);
        let doc = await resourceInstance.save({ session });
        return {
            status: true,
            code: 201,
            result: doc.getFHIRField()
        };
    }

    static async isDocExist(resourceType, id) {
        let count = await mongoose.model(resourceType).countDocuments({
            id: id
        }).limit(1);

        if (count > 0) {
            // Exists
            return {
                status: 1,
                error: ""
            };
        }

        // Not exists
        return {
            status: 2,
            error: ""
        };
    }
}

module.exports.UpdateService = UpdateService;