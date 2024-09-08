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
//#region authenticator
paramsSearchFields["authenticator"] = ["authenticator.reference"];
paramsSearch["authenticator"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "authenticator");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region author
paramsSearchFields["author"] = ["author.reference"];
paramsSearch["author"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "author");
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
//#region contenttype
paramsSearchFields["contenttype"] = ["content.attachment.contentType"];
const contenttypeSearchFunc = {};
contenttypeSearchFunc["content.attachment.contentType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["contenttype"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "contenttype", contenttypeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region custodian
paramsSearchFields["custodian"] = ["custodian.reference"];
paramsSearch["custodian"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "custodian");
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
//#region encounter
paramsSearchFields["encounter"] = ["context.encounter.reference"];
paramsSearch["encounter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "encounter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region event
paramsSearchFields["event"] = ["context.event"];
const eventSearchFunc = {};
eventSearchFunc["context.event"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["event"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "event", eventSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region facility
paramsSearchFields["facility"] = ["context.facilityType"];
const facilitySearchFunc = {};
facilitySearchFunc["context.facilityType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["facility"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "facility", facilitySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region format
paramsSearchFields["format"] = ["content.format"];
const formatSearchFunc = {};
formatSearchFunc["content.format"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["format"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "format", formatSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region identifier
paramsSearchFields["identifier"] = ["masterIdentifier", "identifier"];
paramsSearch["identifier"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "identifier");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region language
paramsSearchFields["language"] = ["content.attachment.language"];
const languageSearchFunc = {};
languageSearchFunc["content.attachment.language"] = (item, field) => {
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
//#region period
paramsSearchFields["period"] = ["context.period"];
const periodSearchFunc = {};
periodSearchFunc["context.period"] = (value, field) => {
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
//#region related
paramsSearchFields["related"] = ["context.related.reference"];
paramsSearch["related"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "related");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region relatesto
paramsSearchFields["relatesto"] = ["relatesTo.target.reference"];
paramsSearch["relatesto"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "relatesto");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region relation
paramsSearchFields["relation"] = ["relatesTo.code"];
const relationSearchFunc = {};
relationSearchFunc["relatesTo.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["relation"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "relation", relationSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region security-label
paramsSearchFields["security-label"] = ["securityLabel"];
const security_labelSearchFunc = {};
security_labelSearchFunc["securityLabel"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["security-label"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "security-label", security_labelSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region setting
paramsSearchFields["setting"] = ["context.practiceSetting"];
const settingSearchFunc = {};
settingSearchFunc["context.practiceSetting"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["setting"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "setting", settingSearchFunc);
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