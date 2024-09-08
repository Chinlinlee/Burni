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
//#region author
paramsSearchFields["author"] = ["author.reference"];
paramsSearch["author"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "author");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region code
paramsSearchFields["code"] = ["code"];
const codeSearchFunc = {};
codeSearchFunc["code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "code", codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region identified
paramsSearchFields["identified"] = ["identifiedDateTime", "identifiedPeriod"];
const identifiedSearchFunc = {};
identifiedSearchFunc["identifiedDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

identifiedSearchFunc["identifiedPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["identified"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "identified", identifiedSearchFunc);
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
//#region implicated
paramsSearchFields["implicated"] = ["implicated.reference"];
paramsSearch["implicated"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "implicated");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region patient
paramsSearchFields["patient"] = ["patient.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;