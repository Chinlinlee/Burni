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
//#region actual
paramsSearchFields["actual"] = ["actual"];
const actualSearchFunc = {};
actualSearchFunc["actual"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["actual"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "actual", actualSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region characteristic
paramsSearchFields["characteristic"] = ["characteristic.code"];
const characteristicSearchFunc = {};
characteristicSearchFunc["characteristic.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["characteristic"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "characteristic", characteristicSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region code
paramsSearchFields["code"] = ["code"];
const codeSearchFunc = {};
codeSearchFunc["code"] = (item, field) => {
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
//#region exclude
paramsSearchFields["exclude"] = ["characteristic.exclude"];
const excludeSearchFunc = {};
excludeSearchFunc["characteristic.exclude"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["exclude"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "exclude", excludeSearchFunc);
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
//#region managing-entity
paramsSearchFields["managing-entity"] = ["managingEntity.reference"];
paramsSearch["managing-entity"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "managing-entity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region member
paramsSearchFields["member"] = ["member.entity.reference"];
paramsSearch["member"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "member");
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
    return queryBuild.tokenQuery(item, "", field, "", false);
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
//#region value
paramsSearchFields["value"] = ["characteristic.valueCodeableConcept", "characteristic.valueBoolean"];
const valueSearchFunc = {};
valueSearchFunc["characteristic.valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

valueSearchFunc["characteristic.valueBoolean"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["value"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "value", valueSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;