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
//#region authored-on
paramsSearchFields["authored-on"] = ["authoredOn"];
const authored_onSearchFunc = {};
authored_onSearchFunc["authoredOn"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["authored-on"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "authored-on", authored_onSearchFunc);
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
//#region business-status
paramsSearchFields["business-status"] = ["businessStatus"];
const business_statusSearchFunc = {};
business_statusSearchFunc["businessStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["business-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "business-status", business_statusSearchFunc);
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
//#region focus
paramsSearchFields["focus"] = ["focus.reference"];
paramsSearch["focus"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "focus");
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
//#region intent
paramsSearchFields["intent"] = ["intent"];
const intentSearchFunc = {};
intentSearchFunc["intent"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["intent"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "intent", intentSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region modified
paramsSearchFields["modified"] = ["lastModified"];
const modifiedSearchFunc = {};
modifiedSearchFunc["lastModified"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["modified"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "modified", modifiedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region owner
paramsSearchFields["owner"] = ["owner.reference"];
paramsSearch["owner"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "owner");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region part-of
paramsSearchFields["part-of"] = ["partOf.reference"];
paramsSearch["part-of"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "part-of");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region patient
paramsSearchFields["patient"] = ["for.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region performer
paramsSearchFields["performer"] = ["performerType"];
const performerSearchFunc = {};
performerSearchFunc["performerType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "performer", performerSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region period
paramsSearchFields["period"] = ["executionPeriod"];
const periodSearchFunc = {};
periodSearchFunc["executionPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["period"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "period", periodSearchFunc);
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
paramsSearchFields["subject"] = ["for.reference"];
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