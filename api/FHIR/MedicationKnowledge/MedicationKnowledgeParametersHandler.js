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
//#region classification
paramsSearchFields["classification"] = ["medicineClassification.classification"];
const classificationSearchFunc = {};
classificationSearchFunc["medicineClassification.classification"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["classification"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "classification", classificationSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region classification-type
paramsSearchFields["classification-type"] = ["medicineClassification.type"];
const classification_typeSearchFunc = {};
classification_typeSearchFunc["medicineClassification.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["classification-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "classification-type", classification_typeSearchFunc);
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
//#region doseform
paramsSearchFields["doseform"] = ["doseForm"];
const doseformSearchFunc = {};
doseformSearchFunc["doseForm"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["doseform"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "doseform", doseformSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region ingredient
paramsSearchFields["ingredient"] = ["ingredient.itemReference.reference"];
paramsSearch["ingredient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "ingredient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region ingredient-code
paramsSearchFields["ingredient-code"] = ["ingredient.itemCodeableConcept"];
const ingredient_codeSearchFunc = {};
ingredient_codeSearchFunc["ingredient.itemCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["ingredient-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "ingredient-code", ingredient_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region manufacturer
paramsSearchFields["manufacturer"] = ["manufacturer.reference"];
paramsSearch["manufacturer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "manufacturer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region monitoring-program-name
paramsSearchFields["monitoring-program-name"] = ["monitoringProgram.name"];
const monitoring_program_nameSearchFunc = {};
monitoring_program_nameSearchFunc["monitoringProgram.name"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["monitoring-program-name"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "monitoring-program-name", monitoring_program_nameSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region monitoring-program-type
paramsSearchFields["monitoring-program-type"] = ["monitoringProgram.type"];
const monitoring_program_typeSearchFunc = {};
monitoring_program_typeSearchFunc["monitoringProgram.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["monitoring-program-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "monitoring-program-type", monitoring_program_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region monograph
paramsSearchFields["monograph"] = ["monograph.source.reference"];
paramsSearch["monograph"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "monograph");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region monograph-type
paramsSearchFields["monograph-type"] = ["monograph.type"];
const monograph_typeSearchFunc = {};
monograph_typeSearchFunc["monograph.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["monograph-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "monograph-type", monograph_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region source-cost
paramsSearchFields["source-cost"] = ["cost.source"];
const source_costSearchFunc = {};
source_costSearchFunc["cost.source"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["source-cost"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "source-cost", source_costSearchFunc);
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