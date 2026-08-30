
const mongoose = require("mongoose");
const _ = require("lodash");
const uuid = require('uuid');

const { renameCollectionFieldName } = require("../../apiService");
const { BaseFhirApiService } = require("./base.service");


const { logger } = require("@root/utils/log");
const { urlJoin } = require("@root/utils/url");


class CreateService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
    }

    async create() {
        try {
            let resource = this.request.body;
            let resourceClone = _.cloneDeep(resource);

            // Validate user request body
            let validation = await BaseFhirApiService.validateRequestResource(resource);
            if (!validation.status) return validation;

        let { status, result } = await CreateService.insertResource(this.resourceType, resourceClone);
        if (status && this.resourceType === "SearchParameter") {
            const { reloadSearchParameterRegistry } = require("@models/FHIR/searchParameter/runtime/registryLifecycle");
            await reloadSearchParameterRegistry();
        }
        return {
                status,
                code: status ? 201 : 500,
                result
            };
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
            return {
                status: false,
                code: 500,
                result: e
            };
        }

    }

    doSuccessResponse(resource) {
        let reqBaseUrl = `${this.request.protocol}://${this.request.get('host')}/`;
        let fullAbsoluteUrl = urlJoin(`${this.request.originalUrl}/${resource.id}`, reqBaseUrl);
        this.response.set("Location", fullAbsoluteUrl);
        
        this.response.append("Last-Modified", (new Date()).toUTCString());
        logger.info(`[Info: create id: ${resource.id} successfully] [Resource Type: ${this.resourceType}]`);
        return this.doResponse(201, resource);
    }

    doFailureResponse(err, code) {
        return this.doResourceChangeFailureResponse(err, code);
    }

    static async insertResource(resourceType, resource, session=undefined) {
        resource.id = uuid.v4();
        const { normalizeResourceTemporals } = require("@models/FHIR/temporal");
        const normalized = normalizeResourceTemporals(resource);
        renameCollectionFieldName(normalized);
        let insertDataObject = new mongoose.model(resourceType)(normalized);
        let doc = await insertDataObject.save({session});
        return {
            status: true,
            result: doc.getFHIRField()
        };
    }

}

module.exports.CreateService = CreateService;