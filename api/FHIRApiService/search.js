const _ = require('lodash');
const fetch = require('node-fetch');
const mongodb = require('models/mongodb');
const {
    createBundle
} = require('models/FHIR/func');
const {
    handleError,
    ErrorOperationOutcome
} = require('models/FHIR/httpMessage');
const FHIR = require('fhir').Fhir;
const { isRealObject } = require('../apiService');
const { logger } = require('../../utils/log');
const { checkIsChainAndGetChainParent, getChainParentJoinQuery }  = require("./search/chain-params");
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string} resourceType 
 * @param {*} paramsSearch 
 * @returns 
 */
module.exports = async function (req, res, resourceType, paramsSearch) {
    logger.info(`[Info: do search] [Resource Type: ${resourceType}] [Content-Type: ${res.getHeader("content-type")}] [Url-SearchParam: ${req.url}]`);
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    Object.keys(queryParameter).forEach(key => {
        if (!queryParameter[key] || isRealObject(queryParameter[key]) || key == "_include" || key == "_revinclude") {
            delete queryParameter[key];
        }
    });
    queryParameter.$and = [];
    for (let key in queryParameter) {
        try {
            if (key.includes(".")) {
                let isChain = checkIsChainAndGetChainParent(resourceType, key);
                if (isChain.status) {
                    queryParameter["isChain"] = true;

                    let joinQuery = getChainParentJoinQuery(isChain.chainParent, queryParameter[key]);

                    if (!_.get(queryParameter, "chain")) queryParameter["chain"] = [];
                    queryParameter["chain"] = [...queryParameter["chain"], joinQuery];
                    delete queryParameter[key];
                }
            } else {
                paramsSearch[key](queryParameter);
            }

        } catch (e) {
            if (key != "$and") {
                logger.error(e);
                logger.error(`[Error: Unknown search parameter ${key} or value ${queryParameter[key]}] [Resource Type: ${resourceType}] [${e}]`);
                return doRes(400, handleError.processing(`Unknown search parameter ${key} or value ${queryParameter[key]}`));
            } 
        }
    }
    if (queryParameter.$and.length == 0) {
        delete queryParameter["$and"];
    }
    try {
        let docs;
        let isChain = _.get(queryParameter, "isChain", false);
        let count = 0;

        if (isChain) {
            let aggregateQuery = [];
            if (_.get(queryParameter, "$and", []).length > 0) {
                let selfMatch = {
                    "$match": {
                        $and: queryParameter.$and
                    }
                };
                aggregateQuery.push(selfMatch);
            }
            aggregateQuery.push(...queryParameter["chain"].flat());
            
            aggregateQuery.push({$skip: paginationSkip});
            aggregateQuery.push({$limit: paginationLimit});
            
            docs = await mongodb[resourceType].aggregate(aggregateQuery).exec();

            aggregateQuery.push({ "$count": "totalDocs" });
            let totalDocs = count = await mongodb[resourceType].aggregate(aggregateQuery).exec();
            count = _.get(totalDocs, "0.totalDocs", 0);

        } else {
            docs = await mongodb[resourceType].find(queryParameter).
                limit(paginationLimit).
                skip(paginationSkip).
                sort({
                    _id: -1
                }).
                exec();
        }

        if (_.isEmpty(queryParameter)) {
            count = await mongodb[resourceType].estimatedDocumentCount();
        } else if (!isChain) {
            count = await mongodb[resourceType].countDocuments(queryParameter);
        }

        if (isChain) {
            docs = docs.map(v => {
                return new mongodb[resourceType](v).getFHIRField();
            });
        } else {
            docs = docs.map(v => {
                return v.getFHIRField();
            });
        }

        let includeDocs = await searchResultParametersHandler["_include"](req.query, docs);
        let reincludeDocs = await searchResultParametersHandler["_revIncludes"](req.query, docs, resourceType);
        docs = [...docs, ...includeDocs, ...reincludeDocs];
        let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, resourceType);
        res.header('Last-Modified', new Date().toUTCString());
        return doRes(200, bundle);
    } catch (e) {
        let errorStr = JSON.stringify(e, Object.getOwnPropertyNames(e));
        logger.error(`[Error: ${errorStr}] [Resource Type: ${resourceType}]`);
        if (_.get(e, "code")) {
            return doRes(e.code, e.operationOutcome);
        }
        let operationOutcomeError = handleError.exception(e);
        return doRes(500, operationOutcomeError);
    }
};
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
    let parameterList = require('../../api_generator/FHIRParametersClean.json');
    let resourceParameterObj = _.get(parameterList, resourceType);
    let parameterObj = resourceParameterObj.find(v => v.parameter == parameter);
    return _.get(parameterObj, "type") === "reference" || parameter === "*";
}

function getResourceSupportIncludeParams(resourceType) {
    let parameterList = require('../../api_generator/FHIRParametersClean.json');
    let resourceParameterObj = _.get(parameterList, resourceType);
    let referenceParams = resourceParameterObj.reduce((prev, current) => {
        if (current.type === "reference") prev.push(current.parameter);
        return prev;
    }, []);
    return referenceParams;
}

function checkIsReferenceTypeSearchParameter(resourceName, searchParam, paramName, queryString) {
    if (!isReferenceTypeSearchParameter(resourceName, searchParam)) {
        let resourceReferenceParams = getResourceSupportIncludeParams(resourceName);
        let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid ${paramName} parameter: \`${queryString}\`. Invalid search parameter: \`${searchParam}\`. The search parameter type must be a reference type. Valid search parameters are: \`${JSON.stringify(resourceReferenceParams)}\``));
        throw error;
    }
}

function checkResourceIsExistInMongoDB(resourceName, paramName, queryString) {
    if (!mongodb[resourceName]) {
        let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid ${paramName} parameter: \`${queryString}\`. Invalid/unsupported resource type: \`${resourceName}\``));
        throw error;
    }
}

function checkSearchParameterName(searchParamFields, resourceName, searchParam, paramName, queryString) {
    if (!searchParamFields) {
        let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid ${paramName} parameter \`${queryString}\`. Unknown search parameter \`${searchParam}\` for resource ${resourceName}`));
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
        if ((!specificType) || specificTypeCondition) {
            let refResourceResponse = await fetch(url, {
                headers: {
                    "accept": "application/fhir+json"
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
async function getIncludeValueInDB(referenceValue, specificType, mongoSearchResult) {
    let specificTypeCondition = specificType && referenceValue.includes(specificType);
    let referenceValueSplit = referenceValue.split("/");
    let resourceInValue = referenceValueSplit[0];
    let id = referenceValueSplit[1];
    if ((!specificType) || specificTypeCondition) {
        if (referenceValueSplit.length === 2) {
            let doc = await mongodb[resourceInValue].findOne({ id: id }).exec();
            if (doc) {
                doc = doc.getFHIRField();
                _.set(doc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(doc);
            }
        } else if (referenceValue.includes("_history") && referenceValueSplit.length === 4) {
            let versionId = referenceValueSplit[3];
            let doc = await mongodb[resourceInValue].findOne({
                $and: [
                    {
                        id: id
                    },
                    {
                        "meta.versionId": versionId
                    }
                ]
            }).exec();
            if (doc) {
                doc = doc.getFHIRField();
                _.set(doc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(doc);
            }
        }
    }
}

async function pushIncludeDocWithField(searchParamFields, doc, specificType, mongoSearchResult) {
    for (let fieldIndex = 0; fieldIndex < searchParamFields.length; fieldIndex++) {
        let field = searchParamFields[fieldIndex];
        let referenceValue = _.get(doc, field, false);
        if (referenceValue) {
            if (isValidHttpUrl(referenceValue)) {
                await getIncludeValueByFetch(referenceValue, specificType, mongoSearchResult);
            } else {
                await getIncludeValueInDB(referenceValue, specificType, mongoSearchResult);
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
        checkIsReferenceTypeSearchParameter(resourceName, searchParam, "_include", includeQuery);
        const paramsSearchFields = require(`../FHIR/${resourceName}/${resourceName}ParametersHandler.js`).paramsSearchFields;
        let searchParamFields = paramsSearchFields[searchParam];
        if (searchParam !== "*") {
            checkSearchParameterName(searchParamFields, resourceName, searchParam, "_include", includeQuery);
            await pushIncludeDocWithField(searchParamFields, doc, specificType, mongoSearchResult);
        } else if (searchParam === "*") {
            let resourceReferenceParams = getResourceSupportIncludeParams(resourceName);
            for (let index = 0; index < resourceReferenceParams.length; index++) {
                let param = resourceReferenceParams[index];
                let paramFields = paramsSearchFields[param];
                await pushIncludeDocWithField(paramFields, doc, specificType, mongoSearchResult);
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
async function getRevIncludeValueInDB(targetResource, referenceValue, field, mongoSearchResult) {
    let doc = await mongodb[targetResource].findOne({
        [field]: referenceValue
    }).exec();
    if (doc) {
        doc = doc.getFHIRField();
        _.set(doc, "myPointToCheckIsInclude", true);
        mongoSearchResult.push(doc);
    }
}

async function pushRevIncludeDocWithField(searchParamFields, targetResource, referenceValue, mongoSearchResult) {
    for (let fieldIndex = 0; fieldIndex < searchParamFields.length; fieldIndex++) {
        let field = searchParamFields[fieldIndex];
        await getRevIncludeValueInDB(targetResource, referenceValue, field, mongoSearchResult);
    }
}
async function pushRevIncludeDoc(revIncludeQuery, doc, mongoSearchResult, resourceType) {
    try {
        if (doc.resourceType != resourceType) return;
        let referenceValue = `${resourceType}/${doc.id}`;
        let [resourceName, searchParam, specificType] = revIncludeQuery.split(":");
        checkResourceIsExistInMongoDB(resourceName, "_revinclude", revIncludeQuery);
        checkIsReferenceTypeSearchParameter(resourceName, searchParam, "_revinclude", revIncludeQuery);
        const paramsSearchFields = require(`../FHIR/${resourceName}/${resourceName}ParametersHandler.js`).paramsSearchFields;
        let searchParamFields = paramsSearchFields[searchParam];
        if (searchParam !== "*") {
            checkSearchParameterName(searchParamFields, resourceName, searchParam, "_include", revIncludeQuery);
            await pushRevIncludeDocWithField(searchParamFields, resourceName, referenceValue, mongoSearchResult);
        } else if (searchParam === "*") {
            let resourceReferenceParams = getResourceSupportIncludeParams(resourceName);
            for (let index = 0; index < resourceReferenceParams.length; index++) {
                let param = resourceReferenceParams[index];
                let paramFields = paramsSearchFields[param];
                await pushRevIncludeDocWithField(paramFields, resourceName, referenceValue, mongoSearchResult);
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
                await pushRevIncludeDoc(revincludeQuery, doc, revincludeDocs, resourceType);
            }
        }
    }
    return revincludeDocs;
}
//#endregion

const searchResultParametersHandler = {
    "_include": async (query, mongoSearchResult) => {
        return await handleIncludeParam(query, mongoSearchResult);
    },
    "_revIncludes": async (query, mongoSearchResult, resourceType) => {
        return await handleRevIncludeParam(query, mongoSearchResult, resourceType);
    }
};