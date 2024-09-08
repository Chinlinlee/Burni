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
//#region authoredon
paramsSearchFields["authoredon"] = ["authoredOn"];
const authoredonSearchFunc = {};
authoredonSearchFunc["authoredOn"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["authoredon"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "authoredon", authoredonSearchFunc);
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
//#region date
paramsSearchFields["date"] = ["dosageInstruction.timing.event"];
const dateSearchFunc = {};
dateSearchFunc["dosageInstruction.timing.event"] = (value, field) => {
    return queryBuild.timingQuery(value, field);
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
//#region intended-dispenser
paramsSearchFields["intended-dispenser"] = ["dispenseRequest.performer.reference"];
paramsSearch["intended-dispenser"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "intended-dispenser");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region intended-performer
paramsSearchFields["intended-performer"] = ["performer.reference"];
paramsSearch["intended-performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "intended-performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region intended-performertype
paramsSearchFields["intended-performertype"] = ["performerType"];
const intended_performertypeSearchFunc = {};
intended_performertypeSearchFunc["performerType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["intended-performertype"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "intended-performertype", intended_performertypeSearchFunc);
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
//#region priority
paramsSearchFields["priority"] = ["priority"];
const prioritySearchFunc = {};
prioritySearchFunc["priority"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["priority"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "priority", prioritySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region requester
paramsSearchFields["requester"] = ["requester.reference"];
paramsSearch["requester"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "requester");
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