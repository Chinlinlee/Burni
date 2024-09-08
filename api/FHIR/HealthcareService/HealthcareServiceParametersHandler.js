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
//#region active
paramsSearchFields["active"] = ["active"];
const activeSearchFunc = {};
activeSearchFunc["active"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["active"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "active", activeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region characteristic
paramsSearchFields["characteristic"] = ["characteristic"];
const characteristicSearchFunc = {};
characteristicSearchFunc["characteristic"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["characteristic"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "characteristic", characteristicSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region coverage-area
paramsSearchFields["coverage-area"] = ["coverageArea.reference"];
paramsSearch["coverage-area"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "coverage-area");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region endpoint
paramsSearchFields["endpoint"] = ["endpoint.reference"];
paramsSearch["endpoint"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "endpoint");
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
//#region location
paramsSearchFields["location"] = ["location.reference"];
paramsSearch["location"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "location");
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
paramsSearchFields["organization"] = ["providedBy.reference"];
paramsSearch["organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region program
paramsSearchFields["program"] = ["program"];
const programSearchFunc = {};
programSearchFunc["program"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["program"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "program", programSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region service-category
paramsSearchFields["service-category"] = ["category"];
const service_categorySearchFunc = {};
service_categorySearchFunc["category"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["service-category"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "service-category", service_categorySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region service-type
paramsSearchFields["service-type"] = ["type"];
const service_typeSearchFunc = {};
service_typeSearchFunc["type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["service-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "service-type", service_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region specialty
paramsSearchFields["specialty"] = ["specialty"];
const specialtySearchFunc = {};
specialtySearchFunc["specialty"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["specialty"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "specialty", specialtySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;