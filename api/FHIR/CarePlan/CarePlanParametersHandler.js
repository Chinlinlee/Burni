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
//#region activity-code
paramsSearchFields["activity-code"] = ["activity.detail.code"];
const activity_codeSearchFunc = {};
activity_codeSearchFunc["activity.detail.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["activity-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "activity-code", activity_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region activity-date
paramsSearchFields["activity-date"] = ["activity.detail.scheduledPeriod", "activity.detail.scheduledTiming"];
const activity_dateSearchFunc = {};
activity_dateSearchFunc["activity.detail.scheduledPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

activity_dateSearchFunc["activity.detail.scheduledTiming"] = (value, field) => {
    return queryBuild.timingQuery(value, field);
};

paramsSearch["activity-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "activity-date", activity_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region activity-reference
paramsSearchFields["activity-reference"] = ["activity.reference.reference"];
paramsSearch["activity-reference"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "activity-reference");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region based-on
paramsSearchFields["based-on"] = ["basedOn.reference"];
paramsSearch["based-on"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "based-on");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region care-team
paramsSearchFields["care-team"] = ["careTeam.reference"];
paramsSearch["care-team"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "care-team");
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
//#region condition
paramsSearchFields["condition"] = ["addresses.reference"];
paramsSearch["condition"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "condition");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region date
paramsSearchFields["date"] = ["period"];
const dateSearchFunc = {};
dateSearchFunc["period"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
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
//#region encounter
paramsSearchFields["encounter"] = ["encounter.reference"];
paramsSearch["encounter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "encounter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region goal
paramsSearchFields["goal"] = ["goal.reference"];
paramsSearch["goal"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "goal");
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
//#region instantiates-canonical
paramsSearchFields["instantiates-canonical"] = ["instantiatesCanonical.reference"];
paramsSearch["instantiates-canonical"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "instantiates-canonical");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region intent
paramsSearchFields["intent"] = ["intent"];
const intentSearchFunc = {};
intentSearchFunc["intent"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["intent"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "intent", intentSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region part-of
paramsSearchFields["part-of"] = ["partOf.reference"];
paramsSearch["part-of"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "part-of");
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
//#region performer
paramsSearchFields["performer"] = ["activity.detail.performer.reference"];
paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region replaces
paramsSearchFields["replaces"] = ["replaces.reference"];
paramsSearch["replaces"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "replaces");
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;