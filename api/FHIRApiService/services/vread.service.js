const mongoose = require("mongoose");

const { handleError } = require("@models/FHIR/httpMessage");
const { BaseFhirApiService } = require("./base.service");

class VReadService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
    }

    async versionRead() {
        let id = this.request.params.id;
        let version = this.request.params.version;

        try {
            let resource = await VReadService.getResourceByIdAndVersion(this.resourceType, id, version);
            if (resource) {
                let responseResource = resource.getFHIRField();
                this.response.header("Last-Modified", new Date(responseResource.meta.lastUpdated).toUTCString());
                return {
                    status: true,
                    code: 200,
                    result: responseResource
                };
            }

            let errorMessage = `not found ${this.resourceType}/${id} with version ${version} in history`;
            let operationOutcomeError = handleError.exception(errorMessage);

            return {
                status: false,
                code: 404,
                result: operationOutcomeError
            };
        } catch(e) {
            return {
                status: false,
                code: 500,
                result: e
            };
        }
    }

    /**
     * Retrieves a resource by its ID and version.
     *
     * @param {string} resourceType - The type of the resource.
     * @param {string} id - The ID of the resource.
     * @param {string} version - The version of the resource.
     * @return {Promise<object>} The resource object.
     */
    static async getResourceByIdAndVersion(resourceType, id, version) {
        let resource = await mongoose.model(`${resourceType}_history`).findOne({
            $and: [
                {
                    id: id
                },
                {
                    "meta.versionId": version
                }
            ]
        }).exec();
        return resource;
    }
}

module.exports.VReadService = VReadService;