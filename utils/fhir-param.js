let parameterList = require('../api_generator/FHIRParametersClean.json');
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
    let theParam = resourceParameters.find(v => v.parameter === paramName);
    if (!theParam) return null;
    return theParam.type;
}

function isResourceType(resourceType) {
    return resourceTypeList.includes(resourceType);
}


module.exports.findParamType = findParamType;
module.exports.isResourceType = isResourceType;