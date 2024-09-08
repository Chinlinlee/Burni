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
//#region actor
paramsSearchFields["actor"] = ["participant.actor.reference"];
paramsSearch["actor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "actor");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region appointment-type
paramsSearchFields["appointment-type"] = ["appointmentType"];
const appointment_typeSearchFunc = {};
appointment_typeSearchFunc["appointmentType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["appointment-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "appointment-type", appointment_typeSearchFunc);
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
//#region date
paramsSearchFields["date"] = ["start"];
const dateSearchFunc = {};
dateSearchFunc["start"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
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
paramsSearchFields["location"] = ["participant.actor.reference"];
paramsSearch["location"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "location");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region part-status
paramsSearchFields["part-status"] = ["participant.status"];
const part_statusSearchFunc = {};
part_statusSearchFunc["participant.status"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["part-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "part-status", part_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region patient
paramsSearchFields["patient"] = ["participant.actor.reference"];
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
paramsSearchFields["practitioner"] = ["participant.actor.reference"];
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
//#region service-category
paramsSearchFields["service-category"] = ["serviceCategory"];
const service_categorySearchFunc = {};
service_categorySearchFunc["serviceCategory"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["service-category"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "service-category", service_categorySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region service-type
paramsSearchFields["service-type"] = ["serviceType"];
const service_typeSearchFunc = {};
service_typeSearchFunc["serviceType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["service-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "service-type", service_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region slot
paramsSearchFields["slot"] = ["slot.reference"];
paramsSearch["slot"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "slot");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region specialty
paramsSearchFields["specialty"] = ["specialty"];
const specialtySearchFunc = {};
specialtySearchFunc["specialty"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["specialty"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "specialty", specialtySearchFunc);
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
//#region supporting-info
paramsSearchFields["supporting-info"] = ["supportingInformation.reference"];
paramsSearch["supporting-info"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "supporting-info");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;