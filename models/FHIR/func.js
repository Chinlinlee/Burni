const _ = require("lodash");
const bundleClass = require("../mongodb/FHIRTypeSchema/Bundle");

function isFirst(offset) {
    return offset == 0;
}

function isHaveNext(offset, count, totalCount) {
    return offset + count <= totalCount;
}
function isLast(offset, count, totalCount) {
    return offset + count >= totalCount;
}

function getUrl(params, http = "http", resource) {
    let baseUrl = `${http}://${process.env.FHIRSERVER_HOST}:${process.env.FHIRSERVER_PORT}/${process.env.FHIRSERVER_APIPATH}/${resource}`;
    let paramsItem = [];
    for (let i in params) {
        let str = `${i}=${params[i]}`;
        paramsItem.push(str);
    }
    baseUrl = `${baseUrl}?${paramsItem.join("&")}`;
    return baseUrl;
}
function getNextUrl(params, http = "http", resource) {
    params["_offset"] += params["_count"];
    let baseUrl = `${http}://${process.env.FHIRSERVER_HOST}:${process.env.FHIRSERVER_PORT}/${process.env.FHIRSERVER_APIPATH}/${resource}`;
    let paramsItem = [];
    for (let i in params) {
        let str = `${i}=${params[i]}`;
        paramsItem.push(str);
    }
    baseUrl = `${baseUrl}?${paramsItem.join("&")}`;
    return baseUrl;
}
function getPreviousUrl(params, http = "http", resource) {
    params["_offset"] -= params["_count"];
    params["_offset"] -= params["_count"];
    console.log(params["_offset"]);
    params["_offset"] = params["_offset"] < 0 ? 0 : params["_offset"];
    let baseUrl = `${http}://${process.env.FHIRSERVER_HOST}:${process.env.FHIRSERVER_PORT}/${process.env.FHIRSERVER_APIPATH}/${resource}`;
    let paramsItem = [];
    for (let i in params) {
        let str = `${i}=${params[i]}`;
        paramsItem.push(str);
    }
    baseUrl = `${baseUrl}?${paramsItem.join("&")}`;
    return baseUrl;
}

/**
 *
 * @param {Object} item
 * @param {import("express").Request} req
 * @param {String} resourceType
 * @param {String} type
 * @returns
 */
function getEntryFullUrl(item, req, resourceType, type = "searchset") {
    let host = req.headers.host
        ? req.headers.host
        : `${process.env.FHIRSERVER_HOST}:${process.env.FHIRSERVER_PORT}`;

    return `${req.protocol}://${host}/${process.env.FHIRSERVER_APIPATH}/${resourceType}/${item.id}`;

}

/**
 *
 * @param {import('express').Request} req
 * @param {*} docs
 * @param {Number} count
 * @param {Number} skip
 * @param {Number} limit
 * @param {*} resource
 * @param {Object} option
 * @param {String} option.type
 * @param {string} option.searchMode
 */
function createBundle(req, docs, count, skip, limit, resource, option) {
    let bundle = new bundleClass.Bundle();
    let type = _.get(option, "type");
    bundle.type = type || "searchset";
    bundle.total = count;
    if (isFirst(skip)) {
        let url = getUrl(req.query, req.protocol, resource);
        let link = new bundleClass.link("self", url);
        bundle.link.push(link);
        if (isHaveNext(skip, limit, count)) {
            let nextUrl = getNextUrl(req.query, req.protocol, resource);
            let nextLink = new bundleClass.link("next", nextUrl);
            bundle.link.push(nextLink);
        }
    } else if (isLast(skip, limit, count)) {
        let url = getUrl(req.query, req.protocol, resource);
        let link = new bundleClass.link("self", url);
        let preUrl = getPreviousUrl(req.query, req.protocol, resource);
        let preLink = new bundleClass.link("previous", preUrl);
        bundle.link.push(link);
        bundle.link.push(preLink);
    } else {
        let url = getUrl(req.query, req.protocol, resource);
        let link = new bundleClass.link("self", url);
        if (isHaveNext(skip, limit, count)) {
            let nextUrl = getNextUrl(req.query, req.protocol, resource);
            let nextLink = new bundleClass.link("next", nextUrl);
            bundle.link.push(nextLink);
        }
        let preUrl = getPreviousUrl(req.query, req.protocol, resource);
        let preLink = new bundleClass.link("previous", preUrl);
        bundle.link.push(link);
        bundle.link.push(preLink);
    }
    if (type == "history") {
        for (let i in docs) {
            let requestObj = _.cloneDeep(docs[i].request);
            let responseObj = _.cloneDeep(docs[i].response);
            delete docs[i].request;
            delete docs[i].response;
            let entry = new bundleClass.entry(
                getEntryFullUrl(docs[i], req, docs[i].resourceType, "history"),
                docs[i]
            );
            entry.request = requestObj;
            entry.response = responseObj;
            bundle.entry.push(entry);
        }
    } else {
        for (let i in docs) {
            let entry = new bundleClass.entry(
                getEntryFullUrl(docs[i], req, docs[i].resourceType),
                docs[i]
            );
            _.set(entry, "search.mode", "match");
            if (_.get(docs[i], "myPointToCheckIsInclude")) {
                delete docs[i]["myPointToCheckIsInclude"];
                _.set(entry, "search.mode", "include");
            }
            bundle.entry.push(entry);
        }
    }

    if (type === "history") {
        // entries with the same fullUrl must have different meta.versionId (except in history bundles)
        bundle.entry = _.uniqWith(bundle.entry, (a , b) => {
            return a.resource.id === b.resource.id &&
                   a.resource.meta.versionId === b.resource.meta.versionId;
        });
    } else {
        // FullUrl must be unique in a bundle
        bundle.entry = _.uniqBy(bundle.entry, "fullUrl");
    }
    
    if (bundle.entry.length == 0) {
        delete bundle.entry;
    }
    for (let index in bundle.link) {
        let link = bundle.link[index];
        link.url = encodeURI(link.url);
    }
    return bundle;
}

module.exports = {
    createBundle: createBundle,
    getEntryFullUrl: getEntryFullUrl
};
