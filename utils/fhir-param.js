let parameterList = require("../api_generator/FHIRParametersClean.json");
const resourceTypeList = require("../models/FHIR/fhir.resourceList.json");

/**
 * @example
 * findParamType("Patient", "name");
 * @param {string} resourceType
 * @param {string} paramName
 * @returns
 */
function findParamType(resourceType, paramName) {
    let resourceParameters = parameterList[resourceType];
    let theParam = resourceParameters.find((v) => v.parameter === paramName);
    if (!theParam) return null;
    return theParam.type;
}

function isResourceType(resourceType) {
    return resourceTypeList.includes(resourceType);
}

function getUrlMatch(url) {
    const urlRegex = /^(http|https):\/\/(.*)\/(\w+\/.+)$/;
    return url.match(urlRegex);
}

/**
 * 
 * @param {string} url 
 * @returns 
 */
function getIdInFullUrl(url) {
    let urlMatch = getUrlMatch(url);
    let id;
    if (urlMatch) {
        id = urlMatch[0];
    } else {
        id = url.split("/").pop();
    }
    return id;
}

/**
 * 
 * @param {string} url 
 */
function getResourceTypeInUrl(url) {
    let urlSplit = url.split("/");
    if (urlSplit.length >= 2) {
        return urlSplit[urlSplit.length - 2];
    }
    let firstElement = urlSplit[0];
    if (firstElement.indexOf("?") >= 0) {
        return firstElement.split("?")[0];
    }

    return urlSplit.pop();
}

module.exports.findParamType = findParamType;
module.exports.isResourceType = isResourceType;
module.exports.getUrlMatch = getUrlMatch;
module.exports.getIdInFullUrl = getIdInFullUrl;
module.exports.getResourceTypeInUrl = getResourceTypeInUrl;
