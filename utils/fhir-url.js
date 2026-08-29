const resourceTypeList = require("../models/FHIR/fhir.resourceList.json");

function isResourceType(resourceType) {
    return resourceTypeList.includes(resourceType);
}

function getUrlMatch(url) {
    const urlRegex = /^(http|https):\/\/(.*)\/(\w+\/.+)$/;
    return url.match(urlRegex);
}

/**
 * @param {string} url
 * @returns {string}
 */
function getIdInFullUrl(url) {
    const urlMatch = getUrlMatch(url);
    let id;
    if (urlMatch) {
        id = urlMatch[0];
    } else {
        id = url.split("/").pop();
    }
    return id;
}

/**
 * @param {string} url
 */
function getResourceTypeInUrl(url) {
    const urlSplit = url.split("/");
    if (urlSplit.length >= 2) {
        return urlSplit[urlSplit.length - 2];
    }
    const firstElement = urlSplit[0];
    if (firstElement.indexOf("?") >= 0) {
        return firstElement.split("?")[0];
    }

    return urlSplit.pop();
}

module.exports = {
    isResourceType,
    getUrlMatch,
    getIdInFullUrl,
    getResourceTypeInUrl
};
