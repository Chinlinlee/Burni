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
//#region abstract
paramsSearchFields["abstract"] = ["abstract"];
const abstractSearchFunc = {};
abstractSearchFunc["abstract"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["abstract"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "abstract", abstractSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region base
paramsSearchFields["base"] = ["baseDefinition.reference"];
paramsSearch["base"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "base");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region base-path
paramsSearchFields["base-path"] = ["snapshot.element.base.path", "differential.element.base.path"];
const base_pathSearchFunc = {};
base_pathSearchFunc["snapshot.element.base.path"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

base_pathSearchFunc["differential.element.base.path"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["base-path"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "base-path", base_pathSearchFunc);
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
//#region derivation
paramsSearchFields["derivation"] = ["derivation"];
const derivationSearchFunc = {};
derivationSearchFunc["derivation"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["derivation"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "derivation", derivationSearchFunc);
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
//#region experimental
paramsSearchFields["experimental"] = ["experimental"];
const experimentalSearchFunc = {};
experimentalSearchFunc["experimental"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["experimental"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "experimental", experimentalSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region ext-context
paramsSearchFields["ext-context"] = ["context.type"];
const ext_contextSearchFunc = {};
ext_contextSearchFunc["context.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["ext-context"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "ext-context", ext_contextSearchFunc);
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
//#region keyword
paramsSearchFields["keyword"] = ["keyword"];
const keywordSearchFunc = {};
keywordSearchFunc["keyword"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
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
//#region kind
paramsSearchFields["kind"] = ["kind"];
const kindSearchFunc = {};
kindSearchFunc["kind"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["kind"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "kind", kindSearchFunc);
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
//#region path
paramsSearchFields["path"] = ["snapshot.element.path", "differential.element.path"];
const pathSearchFunc = {};
pathSearchFunc["snapshot.element.path"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

pathSearchFunc["differential.element.path"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["path"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "path", pathSearchFunc);
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
//#region valueset
paramsSearchFields["valueset"] = ["snapshot.element.binding.valueSet.reference"];
paramsSearch["valueset"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "valueset");
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