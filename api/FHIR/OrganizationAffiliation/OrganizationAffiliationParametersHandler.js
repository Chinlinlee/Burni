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
//#region active
paramsSearchFields["active"] = ["active"];
const activeSearchFunc = {};
activeSearchFunc["active"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["active"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "active", activeSearchFunc);
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
//#region email
paramsSearchFields["email"] = ["telecom"];
paramsSearch["email"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "email");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region endpoint
paramsSearchFields["endpoint"] = ["endpoint.reference"];
paramsSearch["endpoint"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "endpoint");
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
//#region network
paramsSearchFields["network"] = ["network.reference"];
paramsSearch["network"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "network");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region participating-organization
paramsSearchFields["participating-organization"] = ["participatingOrganization.reference"];
paramsSearch["participating-organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "participating-organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region phone
paramsSearchFields["phone"] = ["telecom"];
paramsSearch["phone"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "phone");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region primary-organization
paramsSearchFields["primary-organization"] = ["organization.reference"];
paramsSearch["primary-organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "primary-organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region role
paramsSearchFields["role"] = ["code"];
const roleSearchFunc = {};
roleSearchFunc["code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["role"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "role", roleSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region service
paramsSearchFields["service"] = ["healthcareService.reference"];
paramsSearch["service"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "service");
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
//#region telecom
paramsSearchFields["telecom"] = ["telecom"];
const telecomSearchFunc = {};
telecomSearchFunc["telecom"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["telecom"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "telecom", telecomSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;