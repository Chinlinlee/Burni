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
//#region expiration-date
paramsSearchFields["expiration-date"] = ["batch.expirationDate"];
const expiration_dateSearchFunc = {};
expiration_dateSearchFunc["batch.expirationDate"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["expiration-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "expiration-date", expiration_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region form
paramsSearchFields["form"] = ["form"];
const formSearchFunc = {};
formSearchFunc["form"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["form"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "form", formSearchFunc);
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
//#region lot-number
paramsSearchFields["lot-number"] = ["batch.lotNumber"];
const lot_numberSearchFunc = {};
lot_numberSearchFunc["batch.lotNumber"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["lot-number"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "lot-number", lot_numberSearchFunc);
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