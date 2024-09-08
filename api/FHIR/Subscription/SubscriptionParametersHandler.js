const _ = require('lodash');
const queryBuild = require('../../../models/FHIR/queryBuild.js');
const queryHandler = require('../../../models/FHIR/searchParameterQueryHandler');
const jp = require("jsonpath");
let resourceInclude = require("../../../api_generator/resource-reference/resourceInclude.json");
const {
    chainSearch
} = require('../../../models/FHIR/queryBuild.js');
const path = require("path");

let paramsSearchFields = {};

const paramsSearch = {
    "_id": (query) => {
        query.$and.push({
            id: query["_id"]
        });
        delete query["_id"];
    }
};

paramsSearch["_lastUpdated"] = (query) => {
    if (!_.isArray(query["_lastUpdated"])) {
        query["_lastUpdated"] = [query["_lastUpdated"]];
    }
    for (let i in query["_lastUpdated"]) {
        let buildResult = queryBuild.instantQuery(query["_lastUpdated"][i], "meta.lastUpdated");
        if (!buildResult) {
            throw new Error(`invalid date: ${query["_lastUpdated"]}`);
        }
        query.$and.push(buildResult);
    }
    delete query["_lastUpdated"];
};
//#region contact
paramsSearchFields["contact"] = ["contact"];
const contactSearchFunc = {};
contactSearchFunc["contact"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["contact"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "contact", contactSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region criteria
paramsSearchFields["criteria"] = ["criteria"];
paramsSearchFields["criteria:contains"] = paramsSearchFields["criteria"];
paramsSearchFields["criteria:exact"] = paramsSearchFields["criteria"];
paramsSearch["criteria"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "criteria");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["criteria:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "criteria:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["criteria:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "criteria:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region payload
paramsSearchFields["payload"] = ["channel.payload"];
const payloadSearchFunc = {};
payloadSearchFunc["channel.payload"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["payload"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "payload", payloadSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region status
paramsSearchFields["status"] = ["status"];
const statusSearchFunc = {};
statusSearchFunc["status"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "status", statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region type
paramsSearchFields["type"] = ["channel.type"];
const typeSearchFunc = {};
typeSearchFunc["channel.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "type", typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;