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
//#region body-site
paramsSearchFields["body-site"] = ["bodySite"];
const body_siteSearchFunc = {};
body_siteSearchFunc["bodySite"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["body-site"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "body-site", body_siteSearchFunc);
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
//#region instantiates-canonical
paramsSearchFields["instantiates-canonical"] = ["instantiatesCanonical.reference"];
paramsSearch["instantiates-canonical"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "instantiates-canonical");
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
//#region occurrence
paramsSearchFields["occurrence"] = ["occurrenceDateTime", "occurrencePeriod", "occurrenceTiming"];
const occurrenceSearchFunc = {};
occurrenceSearchFunc["occurrenceDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

occurrenceSearchFunc["occurrencePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

occurrenceSearchFunc["occurrenceTiming"] = (value, field) => {
    return queryBuild.timingQuery(value, field);
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
//#region performer
paramsSearchFields["performer"] = ["performer.reference"];
paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region performer-type
paramsSearchFields["performer-type"] = ["performerType"];
const performer_typeSearchFunc = {};
performer_typeSearchFunc["performerType"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["performer-type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "performer-type", performer_typeSearchFunc);
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
//#region requisition
paramsSearchFields["requisition"] = ["requisition"];
const requisitionSearchFunc = {};
requisitionSearchFunc["requisition"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["requisition"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "requisition", requisitionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region specimen
paramsSearchFields["specimen"] = ["specimen.reference"];
paramsSearch["specimen"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "specimen");
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