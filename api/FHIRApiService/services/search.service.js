const _ = require("lodash");
const mongoose = require("mongoose");
const { BaseFhirApiService } = require("./base.service");
const { handleError, ErrorOperationOutcome } = require("@models/FHIR/httpMessage");

const { logger } = require("@root/utils/log");
const { SearchParameterCreator, UnknownSearchParameterError } = require("../search/searchParameterCreator");
const { SearchProcessor } = require("../search/searchProcessor");
const { createBundle } = require("@root/models/FHIR/func");


class SearchService extends BaseFhirApiService {
    constructor(req, res, resourceType, paramsSearchOfResource) {
        super(req, res, resourceType);
        this.paramsSearchOfResource = paramsSearchOfResource;

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
                query: queryParameter,
                paramsSearch: this.paramsSearchOfResource,
                logger: logger
            });
    
            queryParameter = searchParameterCreator.create();
        } catch (e) {
            if (e instanceof UnknownSearchParameterError) {
                return {
                    status: false,
                    code: 400,
                    result: handleError.processing(e.message)
                };
            }
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

//#region custom functions use in `include` and `revinclude`
function isValidHttpUrl(str) {
    try {
        let url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
        return false;
    }
}

function isReferenceTypeSearchParameter(resourceType, parameter) {
    let parameterList = require("@root/api_generator/FHIRParametersClean.json");
    let resourceParameterObj = _.get(parameterList, resourceType);
    let parameterObj = resourceParameterObj.find(
        (v) => v.parameter == parameter
    );
    return _.get(parameterObj, "type") === "reference" || parameter === "*";
}

function getResourceSupportIncludeParams(resourceType) {
    let parameterList = require("@root/api_generator/FHIRParametersClean.json");
    let resourceParameterObj = _.get(parameterList, resourceType);
    let referenceParams = resourceParameterObj.reduce((prev, current) => {
        if (current.type === "reference") prev.push(current.parameter);
        return prev;
    }, []);
    return referenceParams;
}

function checkIsReferenceTypeSearchParameter(
    resourceName,
    searchParam,
    paramName,
    queryString
) {
    if (!isReferenceTypeSearchParameter(resourceName, searchParam)) {
        let resourceReferenceParams =
            getResourceSupportIncludeParams(resourceName);
        let error = new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter: \`${queryString}\`. Invalid search parameter: \`${searchParam}\`. The search parameter type must be a reference type. Valid search parameters are: \`${JSON.stringify(
                    resourceReferenceParams
                )}\``
            )
        );
        throw error;
    }
}

function checkResourceIsExistInMongoDB(resourceName, paramName, queryString) {
    if (!mongoose.model(resourceName)) {
        let error = new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter: \`${queryString}\`. Invalid/unsupported resource type: \`${resourceName}\``
            )
        );
        throw error;
    }
}

function checkSearchParameterName(
    searchParamFields,
    resourceName,
    searchParam,
    paramName,
    queryString
) {
    if (!searchParamFields) {
        let error = new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter \`${queryString}\`. Unknown search parameter \`${searchParam}\` for resource ${resourceName}`
            )
        );
        throw error;
    }
}
//#endregion

//#region _include
/**
 * Handle the reference of absolute URL
 * @param {string} url
 * @param {string} specificType
 * @param {Array} mongoSearchResult
 */
async function getIncludeValueByFetch(url, specificType, mongoSearchResult) {
    try {
        let specificTypeCondition = specificType && url.includes(specificType);
        if (!specificType || specificTypeCondition) {
            let refResourceResponse = await fetch(url, {
                headers: {
                    accept: "application/fhir+json"
                }
            });
            if (refResourceResponse.status == 200) {
                let refResource = await refResourceResponse.json();
                mongoSearchResult.push(refResource);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}
/**
 * Handle the reference of relative URL e.g. Organization/1
 * @param {string} referenceValue
 * @param {string} specificType
 * @param {Array} mongoSearchResult
 */
async function getIncludeValueInDB(
    referenceValue,
    specificType,
    mongoSearchResult
) {
    let specificTypeCondition =
        specificType && referenceValue.includes(specificType);
    let referenceValueSplit = referenceValue.split("/");
    let resourceInValue = referenceValueSplit[0];
    let id = referenceValueSplit[1];
    if (!specificType || specificTypeCondition) {
        if (referenceValueSplit.length === 2) {
            let doc = await mongoose.model(resourceInValue).findOne({ id: id }).exec();
            if (doc) {
                doc = doc.getFHIRField();
                _.set(doc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(doc);
            }
        } else if (
            referenceValue.includes("_history") &&
            referenceValueSplit.length === 4
        ) {
            let versionId = referenceValueSplit[3];
            let doc = await mongoose.model(resourceInValue)
                .findOne({
                    $and: [
                        {
                            id: id
                        },
                        {
                            "meta.versionId": versionId
                        }
                    ]
                })
                .exec();
            if (doc) {
                doc = doc.getFHIRField();
                _.set(doc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(doc);
            }
        }
    }
}

async function pushIncludeDocWithField(
    searchParamFields,
    doc,
    specificType,
    mongoSearchResult
) {
    for (
        let fieldIndex = 0;
        fieldIndex < searchParamFields.length;
        fieldIndex++
    ) {
        let field = searchParamFields[fieldIndex];
        let referenceValue = _.get(doc, field, false);
        if (referenceValue) {
            if (isValidHttpUrl(referenceValue)) {
                await getIncludeValueByFetch(
                    referenceValue,
                    specificType,
                    mongoSearchResult
                );
            } else {
                await getIncludeValueInDB(
                    referenceValue,
                    specificType,
                    mongoSearchResult
                );
            }
        }
    }
}

/**
 * Find the doc by reference value then push the doc to original result.
 * @param {string} includeQuery
 * @param {Object} doc
 * @param {Array} mongoSearchResult
 */
async function pushIncludeDoc(includeQuery, doc, mongoSearchResult) {
    try {
        let [resourceName, searchParam, specificType] = includeQuery.split(":");
        checkResourceIsExistInMongoDB(resourceName, "_include", includeQuery);
        checkIsReferenceTypeSearchParameter(
            resourceName,
            searchParam,
            "_include",
            includeQuery
        );
        const paramsSearchFields = require(
            `@root/api/FHIR/${resourceName}/${resourceName}ParametersHandler.js`
        ).paramsSearchFields;
        let searchParamFields = paramsSearchFields[searchParam];
        if (searchParam !== "*") {
            checkSearchParameterName(
                searchParamFields,
                resourceName,
                searchParam,
                "_include",
                includeQuery
            );
            await pushIncludeDocWithField(
                searchParamFields,
                doc,
                specificType,
                mongoSearchResult
            );
        } else if (searchParam === "*") {
            let resourceReferenceParams =
                getResourceSupportIncludeParams(resourceName);
            for (
                let index = 0;
                index < resourceReferenceParams.length;
                index++
            ) {
                let param = resourceReferenceParams[index];
                let paramFields = paramsSearchFields[param];
                await pushIncludeDocWithField(
                    paramFields,
                    doc,
                    specificType,
                    mongoSearchResult
                );
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function handleIncludeParam(query, mongoSearchResult) {
    let include = _.get(query, "_include", false);
    let includeDocs = [];
    if (include) {
        if (!_.isArray(include)) include = [include];
        for (let index = 0; index < include.length; index++) {
            let includeQuery = include[index];
            for (let doc of mongoSearchResult) {
                await pushIncludeDoc(includeQuery, doc, includeDocs);
            }
        }
    }
    return includeDocs;
}
//#endregion

//#region _revinclude
async function getRevIncludeValueInDB(
    targetResource,
    referenceValue,
    field,
    mongoSearchResult
) {
    let doc = await mongoose.model(targetResource)
        .findOne({
            [field]: referenceValue
        })
        .exec();
    if (doc) {
        doc = doc.getFHIRField();
        _.set(doc, "myPointToCheckIsInclude", true);
        mongoSearchResult.push(doc);
    }
}

async function pushRevIncludeDocWithField(
    searchParamFields,
    targetResource,
    referenceValue,
    mongoSearchResult
) {
    for (
        let fieldIndex = 0;
        fieldIndex < searchParamFields.length;
        fieldIndex++
    ) {
        let field = searchParamFields[fieldIndex];
        await getRevIncludeValueInDB(
            targetResource,
            referenceValue,
            field,
            mongoSearchResult
        );
    }
}
async function pushRevIncludeDoc(
    revIncludeQuery,
    doc,
    mongoSearchResult,
    resourceType
) {
    try {
        if (doc.resourceType != resourceType) return;
        let referenceValue = `${resourceType}/${doc.id}`;
        let [resourceName, searchParam, specificType] =
            revIncludeQuery.split(":");
        checkResourceIsExistInMongoDB(
            resourceName,
            "_revinclude",
            revIncludeQuery
        );
        checkIsReferenceTypeSearchParameter(
            resourceName,
            searchParam,
            "_revinclude",
            revIncludeQuery
        );
        const paramsSearchFields = require(
            `@root/api/FHIR/${resourceName}/${resourceName}ParametersHandler.js`
        ).paramsSearchFields;
        let searchParamFields = paramsSearchFields[searchParam];
        if (searchParam !== "*") {
            checkSearchParameterName(
                searchParamFields,
                resourceName,
                searchParam,
                "_include",
                revIncludeQuery
            );
            await pushRevIncludeDocWithField(
                searchParamFields,
                resourceName,
                referenceValue,
                mongoSearchResult
            );
        } else if (searchParam === "*") {
            let resourceReferenceParams =
                getResourceSupportIncludeParams(resourceName);
            for (
                let index = 0;
                index < resourceReferenceParams.length;
                index++
            ) {
                let param = resourceReferenceParams[index];
                let paramFields = paramsSearchFields[param];
                await pushRevIncludeDocWithField(
                    paramFields,
                    resourceName,
                    referenceValue,
                    mongoSearchResult
                );
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function handleRevIncludeParam(query, mongoSearchResult, resourceType) {
    let revinclude = _.get(query, "_revinclude", false);
    let revincludeDocs = [];
    if (revinclude) {
        if (!_.isArray(revinclude)) revinclude = [revinclude];
        for (let index = 0; index < revinclude.length; index++) {
            let revincludeQuery = revinclude[index];
            for (let doc of mongoSearchResult) {
                await pushRevIncludeDoc(
                    revincludeQuery,
                    doc,
                    revincludeDocs,
                    resourceType
                );
            }
        }
    }
    return revincludeDocs;
}
//#endregion

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