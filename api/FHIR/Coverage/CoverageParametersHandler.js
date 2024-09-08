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
//#region beneficiary
paramsSearchFields["beneficiary"] = ["beneficiary.reference"];
paramsSearch["beneficiary"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "beneficiary");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region class-type
paramsSearchFields["class-type"] = ["class.type"];
const class_typeSearchFunc = {};
class_typeSearchFunc["class.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["class-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "class-type", class_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region class-value
paramsSearchFields["class-value"] = ["class.value"];
paramsSearchFields["class-value:contains"] = paramsSearchFields["class-value"];
paramsSearchFields["class-value:exact"] = paramsSearchFields["class-value"];
paramsSearch["class-value"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "class-value");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["class-value:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "class-value:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["class-value:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "class-value:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region dependent
paramsSearchFields["dependent"] = ["dependent"];
paramsSearchFields["dependent:contains"] = paramsSearchFields["dependent"];
paramsSearchFields["dependent:exact"] = paramsSearchFields["dependent"];
paramsSearch["dependent"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "dependent");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["dependent:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "dependent:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["dependent:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "dependent:exact");
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
//#region patient
paramsSearchFields["patient"] = ["beneficiary.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region payor
paramsSearchFields["payor"] = ["payor.reference"];
paramsSearch["payor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "payor");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region policy-holder
paramsSearchFields["policy-holder"] = ["policyHolder.reference"];
paramsSearch["policy-holder"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "policy-holder");
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
//#region subscriber
paramsSearchFields["subscriber"] = ["subscriber.reference"];
paramsSearch["subscriber"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "subscriber");
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
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;