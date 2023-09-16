const _ = require("lodash");

const { BaseFhirApiService } = require("./base.service");
const mongoose = require("mongoose");
const { createBundle } = require("@root/models/FHIR/func");
const { handleError } = require("@root/models/FHIR/httpMessage");

class HistoryService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);
        this.queryParameter = _.clone(this.request.query);
        this.resourceId = this.request.params.id;
        /** @private */
        this.skip_ = 0;
        /** @private */
        this.limit_ = 0;
        this.initPagination();
    }

    initPagination() {
        this.skip_ = this.queryParameter["_offset"] ? this.queryParameter["_offset"] : 0;
        this.limit_ = this.queryParameter["_count"] ? this.queryParameter["_count"] : 100;

        _.set(this.request.query, "_offset", this.skip_);
        _.set(this.request.query, "_count", this.limit_);

        delete this.queryParameter["_offset"];
        delete this.queryParameter["_count"];
    }

    async doHistory() {
        try {
            let resources = await HistoryService.getResourceHistoryById(this.resourceType, this.resourceId, this.limit_, this.skip_);

            if (resources.length === 0) {
                let operationOutcomeNotFound = handleError["not-found"](
                    `id->"${this.resourceId}" in resource "${this.resourceType}" not found`
                );

                return {
                    status: false,
                    code: 404,
                    result: operationOutcomeNotFound
                };
            }

            let count = await HistoryService.getResourceHistoryCountById(this.resourceType, this.resourceId);
            let bundle = createBundle(
                this.request,
                resources,
                count,
                this.skip_,
                this.limit_,
                this.resourceType,
                {
                    type: "history"
                }
            );
            
            return {
                status: true,
                code: 200,
                result: bundle
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

    async doSuccessResponse(resource) {
        this.response.header("Last-Modified", new Date().toUTCString());
        return this.doResponse(200, resource);
    }

    static async getResourceHistoryById(resourceType, id, limit, skip) {
        let resources = await mongoose.model(`${resourceType}_history`)
            .find({
                id
            })
            .limit(limit)
            .skip(skip)
            .sort({
                _id: -1
            })
            .exec();

        return resources.map(v => v.getFHIRBundleField());
    }

    static async getResourceHistoryCountById(resourceType, id) {
        return mongoose.model(`${resourceType}_history`).countDocuments({
            id
        });
    }
}

module.exports.HistoryService = HistoryService;