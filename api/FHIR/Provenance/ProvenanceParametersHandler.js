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
//#region agent
paramsSearchFields["agent"] = ["agent.who.reference"];
paramsSearch["agent"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "agent");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region agent-role
paramsSearchFields["agent-role"] = ["agent.role"];
const agent_roleSearchFunc = {};
agent_roleSearchFunc["agent.role"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["agent-role"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "agent-role", agent_roleSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region agent-type
paramsSearchFields["agent-type"] = ["agent.type"];
const agent_typeSearchFunc = {};
agent_typeSearchFunc["agent.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["agent-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "agent-type", agent_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region entity
paramsSearchFields["entity"] = ["entity.what.reference"];
paramsSearch["entity"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "entity");
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
//#region patient
paramsSearchFields["patient"] = ["target.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region recorded
paramsSearchFields["recorded"] = ["recorded"];
const recordedSearchFunc = {};
recordedSearchFunc["recorded"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
};

paramsSearch["recorded"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "recorded", recordedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region signature-type
paramsSearchFields["signature-type"] = ["signature.type"];
const signature_typeSearchFunc = {};
signature_typeSearchFunc["signature.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["signature-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "signature-type", signature_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region target
paramsSearchFields["target"] = ["target.reference"];
paramsSearch["target"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "target");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region when
paramsSearchFields["when"] = ["occurredDateTime"];
const whenSearchFunc = {};
whenSearchFunc["occurredDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["when"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "when", whenSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;