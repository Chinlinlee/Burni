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
//#region action
paramsSearchFields["action"] = ["action"];
const actionSearchFunc = {};
actionSearchFunc["action"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["action"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "action", actionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address
paramsSearchFields["address"] = ["agent.network.address"];
paramsSearch["address"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address:contains"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address:exact"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region agent
paramsSearchFields["agent"] = ["agent.who.reference"];
paramsSearch["agent"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "agent");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region agent-name
paramsSearchFields["agent-name"] = ["agent.name"];
paramsSearchFields["agent-name:contains"] = paramsSearchFields["agent-name"];
paramsSearchFields["agent-name:exact"] = paramsSearchFields["agent-name"];
paramsSearch["agent-name"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "agent-name");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["agent-name:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "agent-name:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["agent-name:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "agent-name:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region agent-role
paramsSearchFields["agent-role"] = ["agent.role"];
const agent_roleSearchFunc = {};
agent_roleSearchFunc["agent.role"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["agent-role"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "agent-role", agent_roleSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region altid
paramsSearchFields["altid"] = ["agent.altId"];
const altidSearchFunc = {};
altidSearchFunc["agent.altId"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["altid"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "altid", altidSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region date
paramsSearchFields["date"] = ["recorded"];
const dateSearchFunc = {};
dateSearchFunc["recorded"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
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
//#region entity
paramsSearchFields["entity"] = ["entity.what.reference"];
paramsSearch["entity"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "entity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region entity-name
paramsSearchFields["entity-name"] = ["entity.name"];
paramsSearchFields["entity-name:contains"] = paramsSearchFields["entity-name"];
paramsSearchFields["entity-name:exact"] = paramsSearchFields["entity-name"];
paramsSearch["entity-name"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "entity-name");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["entity-name:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "entity-name:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["entity-name:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "entity-name:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region entity-role
paramsSearchFields["entity-role"] = ["entity.role"];
const entity_roleSearchFunc = {};
entity_roleSearchFunc["entity.role"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["entity-role"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "entity-role", entity_roleSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region entity-type
paramsSearchFields["entity-type"] = ["entity.type"];
const entity_typeSearchFunc = {};
entity_typeSearchFunc["entity.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["entity-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "entity-type", entity_typeSearchFunc);
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
paramsSearchFields["patient"] = ["agent.who.reference", "entity.what.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region site
paramsSearchFields["site"] = ["source.site"];
const siteSearchFunc = {};
siteSearchFunc["source.site"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["site"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "site", siteSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region source
paramsSearchFields["source"] = ["source.observer.reference"];
paramsSearch["source"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "source");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region subtype
paramsSearchFields["subtype"] = ["subtype"];
const subtypeSearchFunc = {};
subtypeSearchFunc["subtype"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["subtype"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "subtype", subtypeSearchFunc);
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
    return queryBuild.tokenQuery(item, "code", field, "", false);
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