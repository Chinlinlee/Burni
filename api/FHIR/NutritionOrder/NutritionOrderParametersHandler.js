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
//#region additive
paramsSearchFields["additive"] = ["enteralFormula.additiveType"];
const additiveSearchFunc = {};
additiveSearchFunc["enteralFormula.additiveType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["additive"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "additive", additiveSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region datetime
paramsSearchFields["datetime"] = ["dateTime"];
const datetimeSearchFunc = {};
datetimeSearchFunc["dateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["datetime"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "datetime", datetimeSearchFunc);
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
//#region formula
paramsSearchFields["formula"] = ["enteralFormula.baseFormulaType"];
const formulaSearchFunc = {};
formulaSearchFunc["enteralFormula.baseFormulaType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["formula"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "formula", formulaSearchFunc);
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
//#region instantiates-canonical
paramsSearchFields["instantiates-canonical"] = ["instantiatesCanonical.reference"];
paramsSearch["instantiates-canonical"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "instantiates-canonical");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region oraldiet
paramsSearchFields["oraldiet"] = ["oralDiet.type"];
const oraldietSearchFunc = {};
oraldietSearchFunc["oralDiet.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["oraldiet"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "oraldiet", oraldietSearchFunc);
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
//#region provider
paramsSearchFields["provider"] = ["orderer.reference"];
paramsSearch["provider"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "provider");
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
//#region supplement
paramsSearchFields["supplement"] = ["supplement.type"];
const supplementSearchFunc = {};
supplementSearchFunc["supplement.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["supplement"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "supplement", supplementSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;