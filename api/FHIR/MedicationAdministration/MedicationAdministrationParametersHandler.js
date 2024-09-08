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
//#region medication
paramsSearchFields["medication"] = ["medicationReference.reference"];
paramsSearch["medication"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "medication");
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
//#region code
paramsSearchFields["code"] = ["medicationCodeableConcept"];
const codeSearchFunc = {};
codeSearchFunc["medicationCodeableConcept"] = (item, field) => {
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
//#region context
paramsSearchFields["context"] = ["context.reference"];
paramsSearch["context"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "context");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region device
paramsSearchFields["device"] = ["device.reference"];
paramsSearch["device"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "device");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region effective-time
paramsSearchFields["effective-time"] = ["effectiveDateTime", "effectivePeriod"];
const effective_timeSearchFunc = {};
effective_timeSearchFunc["effectiveDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

effective_timeSearchFunc["effectivePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["effective-time"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "effective-time", effective_timeSearchFunc);
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
//#region reason-given
paramsSearchFields["reason-given"] = ["reasonCode"];
const reason_givenSearchFunc = {};
reason_givenSearchFunc["reasonCode"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["reason-given"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "reason-given", reason_givenSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reason-not-given
paramsSearchFields["reason-not-given"] = ["statusReason"];
const reason_not_givenSearchFunc = {};
reason_not_givenSearchFunc["statusReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["reason-not-given"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "reason-not-given", reason_not_givenSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region request
paramsSearchFields["request"] = ["request.reference"];
paramsSearch["request"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "request");
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