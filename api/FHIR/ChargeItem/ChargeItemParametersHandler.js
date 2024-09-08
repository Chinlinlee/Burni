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
//#region account
paramsSearchFields["account"] = ["account.reference"];
paramsSearch["account"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "account");
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
//#region entered-date
paramsSearchFields["entered-date"] = ["enteredDate"];
const entered_dateSearchFunc = {};
entered_dateSearchFunc["enteredDate"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["entered-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "entered-date", entered_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region enterer
paramsSearchFields["enterer"] = ["enterer.reference"];
paramsSearch["enterer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "enterer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region factor-override
paramsSearchFields["factor-override"] = ["factorOverride"];
paramsSearch["factor-override"] = (query) => {
    try {
        queryHandler.getNumberQuery(query, paramsSearchFields, "factor-override");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
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
//#region occurrence
paramsSearchFields["occurrence"] = ["occurrenceDateTime", "occurrencePeriod", "occurrenceTiming"];
const occurrenceSearchFunc = {};
occurrenceSearchFunc["occurrenceDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

occurrenceSearchFunc["occurrencePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

occurrenceSearchFunc["occurrenceTiming"] = (value, field) => {
    return queryBuild.timingQuery(value, field);
};

paramsSearch["occurrence"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "occurrence", occurrenceSearchFunc);
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
//#region performer-actor
paramsSearchFields["performer-actor"] = ["performer.actor.reference"];
paramsSearch["performer-actor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer-actor");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region performer-function
paramsSearchFields["performer-function"] = ["performer.function"];
const performer_functionSearchFunc = {};
performer_functionSearchFunc["performer.function"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["performer-function"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "performer-function", performer_functionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region performing-organization
paramsSearchFields["performing-organization"] = ["performingOrganization.reference"];
paramsSearch["performing-organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performing-organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region price-override
paramsSearchFields["price-override"] = ["priceOverride"];
paramsSearch["price-override"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "price-override");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region quantity
paramsSearchFields["quantity"] = ["quantity"];
paramsSearch["quantity"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "quantity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region requesting-organization
paramsSearchFields["requesting-organization"] = ["requestingOrganization.reference"];
paramsSearch["requesting-organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "requesting-organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region service
paramsSearchFields["service"] = ["service.reference"];
paramsSearch["service"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "service");
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