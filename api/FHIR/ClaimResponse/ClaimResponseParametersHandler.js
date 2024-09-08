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
//#region created
paramsSearchFields["created"] = ["created"];
const createdSearchFunc = {};
createdSearchFunc["created"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["created"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "created", createdSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region disposition
paramsSearchFields["disposition"] = ["disposition"];
paramsSearchFields["disposition:contains"] = paramsSearchFields["disposition"];
paramsSearchFields["disposition:exact"] = paramsSearchFields["disposition"];
paramsSearch["disposition"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "disposition");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["disposition:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "disposition:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["disposition:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "disposition:exact");
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
//#region insurer
paramsSearchFields["insurer"] = ["insurer.reference"];
paramsSearch["insurer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "insurer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region outcome
paramsSearchFields["outcome"] = ["outcome"];
const outcomeSearchFunc = {};
outcomeSearchFunc["outcome"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["outcome"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "outcome", outcomeSearchFunc);
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
//#region payment-date
paramsSearchFields["payment-date"] = ["payment.date"];
const payment_dateSearchFunc = {};
payment_dateSearchFunc["payment.date"] = (value, field) => {
    return queryBuild.dateQuery(value, field);
};

paramsSearch["payment-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "payment-date", payment_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region request
paramsSearchFields["request"] = ["request.reference"];
paramsSearch["request"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "request");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region requestor
paramsSearchFields["requestor"] = ["requestor.reference"];
paramsSearch["requestor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "requestor");
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
//#region use
paramsSearchFields["use"] = ["use"];
const useSearchFunc = {};
useSearchFunc["use"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["use"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "use", useSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;