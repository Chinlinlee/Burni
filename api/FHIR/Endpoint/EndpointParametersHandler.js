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
//#region connection-type
paramsSearchFields["connection-type"] = ["connectionType"];
const connection_typeSearchFunc = {};
connection_typeSearchFunc["connectionType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["connection-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "connection-type", connection_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region identifier
paramsSearchFields["identifier"] = ["identifier"];
paramsSearch["identifier"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "identifier");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region name
paramsSearchFields["name"] = ["name"];
paramsSearchFields["name:contains"] = paramsSearchFields["name"];
paramsSearchFields["name:exact"] = paramsSearchFields["name"];
paramsSearch["name"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["name:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["name:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region organization
paramsSearchFields["organization"] = ["managingOrganization.reference"];
paramsSearch["organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region payload-type
paramsSearchFields["payload-type"] = ["payloadType"];
const payload_typeSearchFunc = {};
payload_typeSearchFunc["payloadType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["payload-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "payload-type", payload_typeSearchFunc);
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;