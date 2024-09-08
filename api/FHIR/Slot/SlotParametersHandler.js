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
//#region schedule
paramsSearchFields["schedule"] = ["schedule.reference"];
paramsSearch["schedule"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "schedule");
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
//#region start
paramsSearchFields["start"] = ["start"];
const startSearchFunc = {};
startSearchFunc["start"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
};

paramsSearch["start"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "start", startSearchFunc);
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;