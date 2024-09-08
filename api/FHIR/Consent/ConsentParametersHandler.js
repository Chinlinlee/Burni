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
//#region action
paramsSearchFields["action"] = ["provision.action"];
const actionSearchFunc = {};
actionSearchFunc["provision.action"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["action"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "action", actionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region actor
paramsSearchFields["actor"] = ["provision.actor.reference.reference"];
paramsSearch["actor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "actor");
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
//#region consentor
paramsSearchFields["consentor"] = ["performer.reference"];
paramsSearch["consentor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "consentor");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region data
paramsSearchFields["data"] = ["provision.data.reference.reference"];
paramsSearch["data"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "data");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region date
paramsSearchFields["date"] = ["dateTime"];
const dateSearchFunc = {};
dateSearchFunc["dateTime"] = (value, field) => {
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
//#region organization
paramsSearchFields["organization"] = ["organization.reference"];
paramsSearch["organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "organization");
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
//#region period
paramsSearchFields["period"] = ["provision.period"];
const periodSearchFunc = {};
periodSearchFunc["provision.period"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["period"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "period", periodSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region purpose
paramsSearchFields["purpose"] = ["provision.purpose"];
const purposeSearchFunc = {};
purposeSearchFunc["provision.purpose"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["purpose"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "purpose", purposeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region scope
paramsSearchFields["scope"] = ["scope"];
const scopeSearchFunc = {};
scopeSearchFunc["scope"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["scope"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "scope", scopeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region security-label
paramsSearchFields["security-label"] = ["provision.securityLabel"];
const security_labelSearchFunc = {};
security_labelSearchFunc["provision.securityLabel"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["security-label"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "security-label", security_labelSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region source-reference
paramsSearchFields["source-reference"] = ["source.reference"];
paramsSearch["source-reference"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "source-reference");
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