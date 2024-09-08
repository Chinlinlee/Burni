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
//#region accession
paramsSearchFields["accession"] = ["accessionIdentifier"];
const accessionSearchFunc = {};
accessionSearchFunc["accessionIdentifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["accession"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "accession", accessionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region bodysite
paramsSearchFields["bodysite"] = ["collection.bodySite"];
const bodysiteSearchFunc = {};
bodysiteSearchFunc["collection.bodySite"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["bodysite"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "bodysite", bodysiteSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region collected
paramsSearchFields["collected"] = ["collection.collectedDateTime", "collection.collectedPeriod"];
const collectedSearchFunc = {};
collectedSearchFunc["collection.collectedDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

collectedSearchFunc["collection.collectedPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["collected"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "collected", collectedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region collector
paramsSearchFields["collector"] = ["collection.collector.reference"];
paramsSearch["collector"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "collector");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region container
paramsSearchFields["container"] = ["container.type"];
const containerSearchFunc = {};
containerSearchFunc["container.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["container"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "container", containerSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region container-id
paramsSearchFields["container-id"] = ["container.identifier"];
const container_idSearchFunc = {};
container_idSearchFunc["container.identifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["container-id"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "container-id", container_idSearchFunc);
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
//#region parent
paramsSearchFields["parent"] = ["parent.reference"];
paramsSearch["parent"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "parent");
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