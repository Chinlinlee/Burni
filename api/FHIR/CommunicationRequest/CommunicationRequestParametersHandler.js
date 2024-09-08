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
//#region authored
paramsSearchFields["authored"] = ["authoredOn"];
const authoredSearchFunc = {};
authoredSearchFunc["authoredOn"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["authored"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "authored", authoredSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region based-on
paramsSearchFields["based-on"] = ["basedOn.reference"];
paramsSearch["based-on"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "based-on");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
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
//#region encounter
paramsSearchFields["encounter"] = ["encounter.reference"];
paramsSearch["encounter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "encounter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region group-identifier
paramsSearchFields["group-identifier"] = ["groupIdentifier"];
const group_identifierSearchFunc = {};
group_identifierSearchFunc["groupIdentifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["group-identifier"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "group-identifier", group_identifierSearchFunc);
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
//#region medium
paramsSearchFields["medium"] = ["medium"];
const mediumSearchFunc = {};
mediumSearchFunc["medium"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["medium"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "medium", mediumSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region occurrence
paramsSearchFields["occurrence"] = ["occurrenceDateTime"];
const occurrenceSearchFunc = {};
occurrenceSearchFunc["occurrenceDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
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
//#region priority
paramsSearchFields["priority"] = ["priority"];
const prioritySearchFunc = {};
prioritySearchFunc["priority"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["priority"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "priority", prioritySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region recipient
paramsSearchFields["recipient"] = ["recipient.reference"];
paramsSearch["recipient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "recipient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region replaces
paramsSearchFields["replaces"] = ["replaces.reference"];
paramsSearch["replaces"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "replaces");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region requester
paramsSearchFields["requester"] = ["requester.reference"];
paramsSearch["requester"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "requester");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region sender
paramsSearchFields["sender"] = ["sender.reference"];
paramsSearch["sender"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "sender");
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