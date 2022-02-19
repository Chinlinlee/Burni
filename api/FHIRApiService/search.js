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
const FHIR = require('../../models/FHIR/fhir/fhir').Fhir;
const { user, isRealObject } = require('../apiService');

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string} resourceType 
 * @param {*} paramsSearch 
 * @returns 
 */
module.exports = async function(req, res, resourceType, paramsSearch) {
    let doRes = function (code , item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    };
    if (!user.checkTokenPermission(req, resourceType, "search-type")) {
        return doRes(403,handleError.forbidden("Your token doesn't have permission with this API"));
    }
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    Object.keys(queryParameter).forEach(key => {
        if (!queryParameter[key] || isRealObject(queryParameter[key]) || key == "_include") {
            delete queryParameter[key];
        }
    });
    queryParameter.$and = [];
    for (let key in queryParameter) {
        try {
            paramsSearch[key](queryParameter);
        } catch (e) {
            if (key != "$and") {
                console.error(e);
                return doRes(400 , handleError.processing(`Unknown search parameter ${key} or value ${queryParameter[key]}`));
            }
        }
    }
    if (queryParameter.$and.length == 0) {
        delete queryParameter["$and"];
    }
    try {
        let docs = await mongodb[resourceType].find(queryParameter).
        limit(paginationLimit).
        skip(paginationSkip).
        sort({
            _id: -1
        }).
        exec();
        docs = docs.map(v => {
            return v.getFHIRField();
        });
        let count = 0;
        if (_.isEmpty(queryParameter)) {
            count = await mongodb[resourceType].estimatedDocumentCount();
        } else {
            count = await mongodb[resourceType].countDocuments(queryParameter);
        }
        await searchResultParametersHandler["_include"](req.query, docs);
        let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, resourceType);
        res.header('Last-Modified', new Date().toUTCString());
        return doRes(200 , bundle);
    } catch (e) {
        console.error(`api ${process.env.FHIRSERVER_APIPATH}/${resourceType}/ has error, `, e);
        if (_.get(e, "code")) {
            return doRes(e.code , e.operationOutcome);
        }
        let operationOutcomeError = handleError.exception(e);
        return doRes(500 , operationOutcomeError);
    }
};

function isValidHttpUrl(str) {
    try {
        let url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch(e) {
        return false;
    }
}

function isReferenceTypeSearchParameter(resourceType, parameter) {
    let parameterList = require('../../api_generator/FHIRParametersClean.json');
    let resourceParameterObj = _.get(parameterList,resourceType);
    let parameterObj = resourceParameterObj.find(v=> v.parameter == parameter);
    return _.get(parameterObj, "type") === "reference";
}

function getResourceSupportIncludeParams(resourceType) {
    let parameterList = require('../../api_generator/FHIRParametersClean.json');
    let resourceParameterObj = _.get(parameterList,resourceType);
    let referenceParams = resourceParameterObj.reduce((prev, current)=> {
        if (current.type === "reference") prev.push(current.parameter);
        return prev;
    } , []);
    return referenceParams;
}

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
        if ( (!specificType) || specificTypeCondition) {
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
    } catch(e) {
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
    if ( (!specificType) || specificTypeCondition) {
        if (referenceValueSplit.length === 2) {
            let doc = await mongodb[resourceInValue].findOne({ id : id }).exec();
            if (doc) mongoSearchResult.push(doc.getFHIRField());
        } else if (referenceValue.includes("_history") && referenceValueSplit.length === 4) {
            let versionId = referenceValueSplit[3];
            let doc = await mongodb[resourceInValue].findOne({ 
                $and: [
                    {
                        id : id
                    },
                    {
                        "meta.versionId": versionId
                    }
                ]
            }).exec();
            if(doc) mongoSearchResult.push(doc.getFHIRField());
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
        if (!mongodb[resourceName]) {
            let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid _include parameter: \`${includeQuery}\`. Invalid/unsupported resource type: \`${resourceName}\``));
            throw error;
        }
        if (!isReferenceTypeSearchParameter(resourceName, searchParam)) {
            let resourceReferenceParams = getResourceSupportIncludeParams(resourceName);
            let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid _include parameter: \`${includeQuery}\`. Invalid search parameter: \`${searchParam}\`. The search parameter type must be a reference type. Valid search parameters are: \`${JSON.stringify(resourceReferenceParams)}\``));
            throw error;
        }
        const paramsSearchFields = require(`../FHIR/${resourceName}/${resourceName}ParametersHandler.js`).paramsSearchFields;
        let searchParamFields = paramsSearchFields[searchParam];
        if (!searchParamFields) {
            let error = new ErrorOperationOutcome(400, handleError.processing(`Invalid _include parameter \`${includeQuery}\`. Unknown search parameter \`${searchParam}\` for resource ${resourceName}`));
            throw error;
        }
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
    } catch(e) {
        console.error(e);
        throw e;
    }
}

async function handleIncludeParam(query, mongoSearchResult) {
    let include = _.get(query, "_include", false);
    if (include) {
        if (!_.isArray(include)) include = [include];
        for (let index = 0; index < include.length; index++) {
            let includeQuery = include[index];
            for (let doc of mongoSearchResult) {
                await pushIncludeDoc(includeQuery, doc, mongoSearchResult);
            }
        }
    }
}
//#endregion

const searchResultParametersHandler = {
    "_include": async (query, mongoSearchResult) => { 
        await handleIncludeParam(query,mongoSearchResult);
    }
};