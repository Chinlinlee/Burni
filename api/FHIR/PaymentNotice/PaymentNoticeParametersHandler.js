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
//#region payment-status
paramsSearchFields["payment-status"] = ["paymentStatus"];
const payment_statusSearchFunc = {};
payment_statusSearchFunc["paymentStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["payment-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "payment-status", payment_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region provider
paramsSearchFields["provider"] = ["provider.reference"];
paramsSearch["provider"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "provider");
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
//#region response
paramsSearchFields["response"] = ["response.reference"];
paramsSearch["response"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "response");
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