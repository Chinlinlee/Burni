
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
const { BaseFhirApiService } = require("./base.service");


const { logger } = require("@root/utils/log");


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
            return {
                status,
                code: status ? 201 : 500,
                result
            };
        } catch (e) {
            return {
                status: false,
                code: 500,
                result: e
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
        return this.doResourceChangeFailureResponse(err, code);
    }

    static async insertResource(resourceType, resource, session=undefined) {
        renameCollectionFieldName(resource);
        resource.id = uuid.v4();
        let insertDataObject = new mongoose.model(resourceType)(resource);
        let doc = await insertDataObject.save({session});
        return {
            status: true,
            result: doc.getFHIRField()
        };
    }

}

module.exports.CreateService = CreateService;