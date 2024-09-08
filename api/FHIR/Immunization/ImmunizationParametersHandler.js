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
//#region date
paramsSearchFields["date"] = ["occurrenceDateTime"];
const dateSearchFunc = {};
dateSearchFunc["occurrenceDateTime"] = (value, field) => {
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
//#region lot-number
paramsSearchFields["lot-number"] = ["lotNumber"];
paramsSearchFields["lot-number:contains"] = paramsSearchFields["lot-number"];
paramsSearchFields["lot-number:exact"] = paramsSearchFields["lot-number"];
paramsSearch["lot-number"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "lot-number");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["lot-number:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "lot-number:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["lot-number:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "lot-number:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region manufacturer
paramsSearchFields["manufacturer"] = ["manufacturer.reference"];
paramsSearch["manufacturer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "manufacturer");
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
//#region performer
paramsSearchFields["performer"] = ["performer.actor.reference"];
paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reaction
paramsSearchFields["reaction"] = ["reaction.detail.reference"];
paramsSearch["reaction"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "reaction");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reaction-date
paramsSearchFields["reaction-date"] = ["reaction.date"];
const reaction_dateSearchFunc = {};
reaction_dateSearchFunc["reaction.date"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["reaction-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "reaction-date", reaction_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reason-code
paramsSearchFields["reason-code"] = ["reasonCode"];
const reason_codeSearchFunc = {};
reason_codeSearchFunc["reasonCode"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["reason-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "reason-code", reason_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reason-reference
paramsSearchFields["reason-reference"] = ["reasonReference.reference"];
paramsSearch["reason-reference"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "reason-reference");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region series
paramsSearchFields["series"] = ["protocolApplied.series"];
paramsSearchFields["series:contains"] = paramsSearchFields["series"];
paramsSearchFields["series:exact"] = paramsSearchFields["series"];
paramsSearch["series"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "series");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["series:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "series:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["series:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "series:exact");
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
//#region status-reason
paramsSearchFields["status-reason"] = ["statusReason"];
const status_reasonSearchFunc = {};
status_reasonSearchFunc["statusReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["status-reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "status-reason", status_reasonSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region target-disease
paramsSearchFields["target-disease"] = ["protocolApplied.targetDisease"];
const target_diseaseSearchFunc = {};
target_diseaseSearchFunc["protocolApplied.targetDisease"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["target-disease"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "target-disease", target_diseaseSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region vaccine-code
paramsSearchFields["vaccine-code"] = ["vaccineCode"];
const vaccine_codeSearchFunc = {};
vaccine_codeSearchFunc["vaccineCode"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["vaccine-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "vaccine-code", vaccine_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;