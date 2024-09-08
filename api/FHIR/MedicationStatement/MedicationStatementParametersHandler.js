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
//#region code
paramsSearchFields["code"] = ["medicationCodeableConcept"];
const codeSearchFunc = {};
codeSearchFunc["medicationCodeableConcept"] = (item, field) => {
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
//#region context
paramsSearchFields["context"] = ["context.reference"];
paramsSearch["context"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "context");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region effective
paramsSearchFields["effective"] = ["effectiveDateTime", "effectivePeriod"];
const effectiveSearchFunc = {};
effectiveSearchFunc["effectiveDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

effectiveSearchFunc["effectivePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["effective"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "effective", effectiveSearchFunc);
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
//#region medication
paramsSearchFields["medication"] = ["medicationReference.reference"];
paramsSearch["medication"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "medication");
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
//#region source
paramsSearchFields["source"] = ["informationSource.reference"];
paramsSearch["source"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "source");
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;