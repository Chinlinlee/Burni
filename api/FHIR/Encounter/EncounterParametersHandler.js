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
//#region appointment
paramsSearchFields["appointment"] = ["appointment.reference"];
paramsSearch["appointment"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "appointment");
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
//#region class
paramsSearchFields["class"] = ["class"];
const classSearchFunc = {};
classSearchFunc["class"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["class"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "class", classSearchFunc);
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
//#region diagnosis
paramsSearchFields["diagnosis"] = ["diagnosis.condition.reference"];
paramsSearch["diagnosis"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "diagnosis");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region episode-of-care
paramsSearchFields["episode-of-care"] = ["episodeOfCare.reference"];
paramsSearch["episode-of-care"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "episode-of-care");
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
//#region length
paramsSearchFields["length"] = ["length"];
paramsSearch["length"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "length");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region location
paramsSearchFields["location"] = ["location.location.reference"];
paramsSearch["location"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "location");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region location-period
paramsSearchFields["location-period"] = ["location.period"];
const location_periodSearchFunc = {};
location_periodSearchFunc["location.period"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["location-period"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "location-period", location_periodSearchFunc);
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
//#region participant
paramsSearchFields["participant"] = ["participant.individual.reference"];
paramsSearch["participant"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "participant");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region participant-type
paramsSearchFields["participant-type"] = ["participant.type"];
const participant_typeSearchFunc = {};
participant_typeSearchFunc["participant.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["participant-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "participant-type", participant_typeSearchFunc);
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
//#region practitioner
paramsSearchFields["practitioner"] = ["participant.individual.reference"];
paramsSearch["practitioner"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "practitioner");
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
//#region service-provider
paramsSearchFields["service-provider"] = ["serviceProvider.reference"];
paramsSearch["service-provider"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "service-provider");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region special-arrangement
paramsSearchFields["special-arrangement"] = ["hospitalization.specialArrangement"];
const special_arrangementSearchFunc = {};
special_arrangementSearchFunc["hospitalization.specialArrangement"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["special-arrangement"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "special-arrangement", special_arrangementSearchFunc);
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