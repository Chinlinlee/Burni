const _ = require("lodash");
const mongoose = require("mongoose");


const { renameCollectionFieldName } = require("../../apiService");
const {
    issue,
    OperationOutcome,
    handleError
} = require("@models/FHIR/httpMessage");
const { BaseFhirApiService } = require("./base.service");

const { logger } = require("@root/utils/log");

class UpdateService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
        this.resourceId = this.request.params.id;
    }

    async update() {
        try {
            let resource = this.request.body;
            let resourceClone = _.cloneDeep(resource);

            let validation = await this.validateRequestResource(resource);
            if (!validation.status) return validation;

            let docExist = await this.isDocExist();
            if (docExist.status === 1) {
                return await this.updateResource(resourceClone);
            } else if (docExist.status === 2) {
                return await this.insertResource(resourceClone);
            }
            
        } catch (e) {
            return {
                status: false,
                code: 500,
                result: e
            };
        }
    }

    doSuccessResponse(resource) {
        if (resource.code === 201) {
            let reqBaseUrl = `${this.request.protocol}://${this.request.get("host")}/`;
            let fullAbsoluteUrl = new URL(this.request.originalUrl, reqBaseUrl).href;
            this.response.set("Location", fullAbsoluteUrl);
        }
        this.response.append("Last-Modified", new Date().toUTCString());
        return this.doResponse(resource.code, resource.doc);
    }

    doFailureResponse(err, code) {
        this.doResourceChangeFailureResponse(err, code);
    }

    async updateResource(resource) {
        delete resource.id;
        renameCollectionFieldName(resource);
        resource.id = this.resourceId;

        let newDoc = await mongoose.model(this.resourceType).findOneAndUpdate(
            {
                id: this.resourceId
            },
            {
                $set: resource
            },
            {
                new: true,
                rawResult: true
            }
        );

        return {
            status: true,
            code: 201,
            doc: newDoc.value.getFHIRField()
        };
    }

    async insertResource(resource) {
        resource.id = this.resourceId;
        renameCollectionFieldName(resource);
        let updateData = new mongoose.model(this.resourceType)(resource);
        let doc = await updateData.save();
        return {
            status: true,
            code: 200,
            doc: doc.getFHIRField()
        };
    }

    async isDocExist() {
        let count = await mongoose.model(this.resourceType).countDocuments({
            id: this.resourceID
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