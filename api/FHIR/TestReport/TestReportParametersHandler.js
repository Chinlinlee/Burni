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
//#region issued
paramsSearchFields["issued"] = ["issued"];
const issuedSearchFunc = {};
issuedSearchFunc["issued"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["issued"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "issued", issuedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region result
paramsSearchFields["result"] = ["result"];
const resultSearchFunc = {};
resultSearchFunc["result"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["result"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "result", resultSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region tester
paramsSearchFields["tester"] = ["tester"];
paramsSearchFields["tester:contains"] = paramsSearchFields["tester"];
paramsSearchFields["tester:exact"] = paramsSearchFields["tester"];
paramsSearch["tester"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "tester");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["tester:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "tester:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["tester:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "tester:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region testscript
paramsSearchFields["testscript"] = ["testScript.reference"];
paramsSearch["testscript"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "testscript");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;