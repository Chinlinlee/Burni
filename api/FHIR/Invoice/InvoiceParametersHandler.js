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
//#region account
paramsSearchFields["account"] = ["account.reference"];
paramsSearch["account"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "account");
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
//#region issuer
paramsSearchFields["issuer"] = ["issuer.reference"];
paramsSearch["issuer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "issuer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region participant
paramsSearchFields["participant"] = ["participant.actor.reference"];
paramsSearch["participant"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "participant");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region participant-role
paramsSearchFields["participant-role"] = ["participant.role"];
const participant_roleSearchFunc = {};
participant_roleSearchFunc["participant.role"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["participant-role"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "participant-role", participant_roleSearchFunc);
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
//#region recipient
paramsSearchFields["recipient"] = ["recipient.reference"];
paramsSearch["recipient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "recipient");
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
//#region totalgross
paramsSearchFields["totalgross"] = ["totalGross"];
paramsSearch["totalgross"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "totalgross");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region totalnet
paramsSearchFields["totalnet"] = ["totalNet"];
paramsSearch["totalnet"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "totalnet");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region type
paramsSearchFields["type"] = ["type"];
const typeSearchFunc = {};
typeSearchFunc["type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "type", typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;