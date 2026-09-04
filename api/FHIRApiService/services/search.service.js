const _ = require("lodash");
const mongoose = require("mongoose");
const { BaseFhirApiService } = require("./base.service");
const { handleError } = require("@models/FHIR/httpMessage");

const { logger } = require("@root/utils/log");
const {
    SearchParameterCreator,
    UnknownSearchParameterError,
    InvalidSearchParameterValueError,
    RelationLimitSearchParameterError
} = require("../search/searchParameterCreator");
const { SearchProcessor } = require("../search/searchProcessor");
const { createBundle } = require("@root/models/FHIR/func");
const {
    handleIncludeParam,
    handleRevIncludeParam
} = require("@models/FHIR/searchParameter/runtime/includeHandler");

class SearchService extends BaseFhirApiService {
    constructor(req, res, resourceType) {
        super(req, res, resourceType);

        this._total = req.query["_total"];
        delete this.request.query["_total"];
    }

    async search() {
        logger.info(`[Info: do search] [Resource Type: ${this.resourceType}] [Content-Type: ${this.response.getHeader(
            "content-type"
        )}] [Url-SearchParam: ${this.request.url}]`);
    
        let queryParameter = _.cloneDeep(this.request.query);
        let paginationSkip =
            queryParameter["_offset"] == undefined ? 0 : queryParameter["_offset"];
        let paginationLimit =
            queryParameter["_count"] == undefined ? 100 : queryParameter["_count"];
        _.set(this.request.query, "_offset", paginationSkip);
        _.set(this.request.query, "_count", paginationLimit);
        delete queryParameter["_count"];
        delete queryParameter["_offset"];
    
        try {
            let searchParameterCreator = new SearchParameterCreator({
                resourceType: this.resourceType,
                query: queryParameter
            });
    
            queryParameter = await searchParameterCreator.create();
        } catch (e) {
            if (
                e instanceof UnknownSearchParameterError ||
                e instanceof InvalidSearchParameterValueError ||
                e instanceof RelationLimitSearchParameterError
            ) {
                return {
                    status: false,
                    code: 400,
                    result: handleError.processing(e.message)
                };
            }
            logger.error(e);
            return {
                status: false,
                code: 400,
                result: handleError.processing(
                    e instanceof Error && e.message
                        ? e.message
                        : "Unknown search parameter or value"
                )
            };
        }
        logger.info(`[mongo query: ${JSON.stringify(queryParameter)}]`);
        
        try {
            let isChain = _.get(queryParameter, "isChain", false);
            let searchProcessor = new SearchProcessor({
                resourceType: this.resourceType,
                isChain: isChain,
                query: queryParameter,
                skip: paginationSkip,
                limit: paginationLimit,
                totalMode: this._total
            });
            let { docs, count } = await searchProcessor.search();
    
            if (isChain) {
                docs = docs.map((v) => {
                    return new mongoose.model(this.resourceType)(v).getFHIRField();
                });
            } else {
                docs = docs.map((v) => {
                    return v.getFHIRField();
                });
            }
    
            let includeDocs = await searchResultParametersHandler["_include"](
                this.request.query,
                docs
            );
            let reincludeDocs = await searchResultParametersHandler["_revIncludes"](
                this.request.query,
                docs,
                this.resourceType
            );

            docs = [...docs, ...includeDocs, ...reincludeDocs];
            let bundle = createBundle(
                this.request,
                docs,
                count,
                paginationSkip,
                paginationLimit,
                this.resourceType
            );
            this.response.header("Last-Modified", new Date().toUTCString());
            return {
                status: true,
                code: 200,
                result: bundle
            };
        } catch (e) {
            let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
            logger.error(`[Error: ${errorStr}] [Resource Type: ${this.resourceType}]`);
            if (_.get(e, "code")) {
                return {
                    status: false,
                    code: e.code,
                    result: e.operationOutcome
                };
            }
            let operationOutcomeError = handleError.exception(`Server Error Occurred`);
            return {
                status: false,
                code: 500,
                result: operationOutcomeError
            };
        }
    }
}

const searchResultParametersHandler = {
    _include: async (query, mongoSearchResult) => {
        return await handleIncludeParam(query, mongoSearchResult);
    },
    _revIncludes: async (query, mongoSearchResult, resourceType) => {
        return await handleRevIncludeParam(
            query,
            mongoSearchResult,
            resourceType
        );
    }
};

module.exports.SearchService = SearchService;
