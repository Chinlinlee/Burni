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
//#region code
paramsSearchFields["code"] = ["concept.code"];
const codeSearchFunc = {};
codeSearchFunc["concept.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
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
//#region content-mode
paramsSearchFields["content-mode"] = ["content"];
const content_modeSearchFunc = {};
content_modeSearchFunc["content"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["content-mode"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "content-mode", content_modeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region context
paramsSearchFields["context"] = ["useContext.valueCodeableConcept"];
const contextSearchFunc = {};
contextSearchFunc["useContext.valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["context"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "context", contextSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region context-quantity
paramsSearchFields["context-quantity"] = ["useContext.valueQuantity", "useContext.valueRange"];
paramsSearch["context-quantity"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "context-quantity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region context-type
paramsSearchFields["context-type"] = ["useContext.code"];
const context_typeSearchFunc = {};
context_typeSearchFunc["useContext.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["context-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "context-type", context_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region date
paramsSearchFields["date"] = ["date"];
const dateSearchFunc = {};
dateSearchFunc["date"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
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
//#region description
paramsSearchFields["description"] = ["description"];
paramsSearchFields["description:contains"] = paramsSearchFields["description"];
paramsSearchFields["description:exact"] = paramsSearchFields["description"];
paramsSearch["description"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "description");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["description:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "description:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["description:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "description:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region jurisdiction
paramsSearchFields["jurisdiction"] = ["jurisdiction"];
const jurisdictionSearchFunc = {};
jurisdictionSearchFunc["jurisdiction"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["jurisdiction"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "jurisdiction", jurisdictionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region language
paramsSearchFields["language"] = ["concept.designation.language"];
const languageSearchFunc = {};
languageSearchFunc["concept.designation.language"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["language"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "language", languageSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region name
paramsSearchFields["name"] = ["name"];
paramsSearchFields["name:contains"] = paramsSearchFields["name"];
paramsSearchFields["name:exact"] = paramsSearchFields["name"];
paramsSearch["name"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["name:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["name:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "name:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region publisher
paramsSearchFields["publisher"] = ["publisher"];
paramsSearchFields["publisher:contains"] = paramsSearchFields["publisher"];
paramsSearchFields["publisher:exact"] = paramsSearchFields["publisher"];
paramsSearch["publisher"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "publisher");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["publisher:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "publisher:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["publisher:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "publisher:exact");
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
//#region supplements
paramsSearchFields["supplements"] = ["supplements.reference"];
paramsSearch["supplements"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "supplements");
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
//#region version
paramsSearchFields["version"] = ["version"];
const versionSearchFunc = {};
versionSearchFunc["version"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["version"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "version", versionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;