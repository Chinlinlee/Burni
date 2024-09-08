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
//#region date
paramsSearchFields["date"] = ["period"];
const dateSearchFunc = {};
dateSearchFunc["period"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "date", dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region focus
paramsSearchFields["focus"] = ["focus"];
const focusSearchFunc = {};
focusSearchFunc["focus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["focus"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "focus", focusSearchFunc);
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
//#region keyword
paramsSearchFields["keyword"] = ["keyword"];
const keywordSearchFunc = {};
keywordSearchFunc["keyword"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["keyword"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "keyword", keywordSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region location
paramsSearchFields["location"] = ["location"];
const locationSearchFunc = {};
locationSearchFunc["location"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["location"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "location", locationSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region partof
paramsSearchFields["partof"] = ["partOf.reference"];
paramsSearch["partof"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "partof");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region principalinvestigator
paramsSearchFields["principalinvestigator"] = ["principalInvestigator.reference"];
paramsSearch["principalinvestigator"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "principalinvestigator");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region protocol
paramsSearchFields["protocol"] = ["protocol.reference"];
paramsSearch["protocol"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "protocol");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region site
paramsSearchFields["site"] = ["site.reference"];
paramsSearch["site"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "site");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region sponsor
paramsSearchFields["sponsor"] = ["sponsor.reference"];
paramsSearch["sponsor"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "sponsor");
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
//#region title
paramsSearchFields["title"] = ["title"];
paramsSearchFields["title:contains"] = paramsSearchFields["title"];
paramsSearchFields["title:exact"] = paramsSearchFields["title"];
paramsSearch["title"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "title");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["title:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "title:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["title:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "title:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;