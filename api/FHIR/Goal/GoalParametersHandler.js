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
//#region achievement-status
paramsSearchFields["achievement-status"] = ["achievementStatus"];
const achievement_statusSearchFunc = {};
achievement_statusSearchFunc["achievementStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["achievement-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "achievement-status", achievement_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region category
paramsSearchFields["category"] = ["category"];
const categorySearchFunc = {};
categorySearchFunc["category"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["category"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "category", categorySearchFunc);
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
//#region lifecycle-status
paramsSearchFields["lifecycle-status"] = ["lifecycleStatus"];
const lifecycle_statusSearchFunc = {};
lifecycle_statusSearchFunc["lifecycleStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["lifecycle-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "lifecycle-status", lifecycle_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region patient
paramsSearchFields["patient"] = ["subject.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region start-date
paramsSearchFields["start-date"] = ["startDate"];
const start_dateSearchFunc = {};
start_dateSearchFunc["startDate"] = (value, field) => {
    return queryBuild.dateQuery(value, field);
};

paramsSearch["start-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "start-date", start_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region subject
paramsSearchFields["subject"] = ["subject.reference"];
paramsSearch["subject"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "subject");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region target-date
paramsSearchFields["target-date"] = ["target.dueDate"];
const target_dateSearchFunc = {};
target_dateSearchFunc["target.dueDate"] = (value, field) => {
    return queryBuild.dateQuery(value, field);
};

paramsSearch["target-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "target-date", target_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;