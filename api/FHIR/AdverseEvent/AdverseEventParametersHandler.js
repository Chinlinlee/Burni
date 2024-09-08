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
//#region actuality
paramsSearchFields["actuality"] = ["actuality"];
const actualitySearchFunc = {};
actualitySearchFunc["actuality"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["actuality"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "actuality", actualitySearchFunc);
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
//#region date
paramsSearchFields["date"] = ["date"];
const dateSearchFunc = {};
dateSearchFunc["date"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "date", dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region event
paramsSearchFields["event"] = ["event"];
const eventSearchFunc = {};
eventSearchFunc["event"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["event"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "event", eventSearchFunc);
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
//#region recorder
paramsSearchFields["recorder"] = ["recorder.reference"];
paramsSearch["recorder"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "recorder");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region resultingcondition
paramsSearchFields["resultingcondition"] = ["resultingCondition.reference"];
paramsSearch["resultingcondition"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "resultingcondition");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region seriousness
paramsSearchFields["seriousness"] = ["seriousness"];
const seriousnessSearchFunc = {};
seriousnessSearchFunc["seriousness"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["seriousness"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "seriousness", seriousnessSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region severity
paramsSearchFields["severity"] = ["severity"];
const severitySearchFunc = {};
severitySearchFunc["severity"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["severity"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "severity", severitySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region study
paramsSearchFields["study"] = ["study.reference"];
paramsSearch["study"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "study");
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
//#region substance
paramsSearchFields["substance"] = ["suspectEntity.instance.reference"];
paramsSearch["substance"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "substance");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;