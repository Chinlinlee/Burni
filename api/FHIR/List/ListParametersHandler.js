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
//#region empty-reason
paramsSearchFields["empty-reason"] = ["emptyReason"];
const empty_reasonSearchFunc = {};
empty_reasonSearchFunc["emptyReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["empty-reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "empty-reason", empty_reasonSearchFunc);
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
//#region item
paramsSearchFields["item"] = ["entry.item.reference"];
paramsSearch["item"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "item");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region notes
paramsSearchFields["notes"] = ["note.text"];
paramsSearchFields["notes:contains"] = paramsSearchFields["notes"];
paramsSearchFields["notes:exact"] = paramsSearchFields["notes"];
paramsSearch["notes"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "notes");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["notes:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "notes:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["notes:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "notes:exact");
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
//#region source
paramsSearchFields["source"] = ["source.reference"];
paramsSearch["source"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "source");
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