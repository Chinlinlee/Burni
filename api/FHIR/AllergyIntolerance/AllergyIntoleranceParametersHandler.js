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
paramsSearchFields["code"] = ["code", "reaction.substance"];
const codeSearchFunc = {};
codeSearchFunc["code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

codeSearchFunc["reaction.substance"] = (item, field) => {
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
paramsSearchFields["date"] = ["recordedDate"];
const dateSearchFunc = {};
dateSearchFunc["recordedDate"] = (value, field) => {
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
//#region patient
paramsSearchFields["patient"] = ["patient.reference"];
paramsSearch["patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "patient");
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
    return queryBuild.tokenQuery(item, "", field, "", false);
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
//#region asserter
paramsSearchFields["asserter"] = ["asserter.reference"];
paramsSearch["asserter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "asserter");
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
    return queryBuild.tokenQuery(item, "", field, "", false);
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
//#region clinical-status
paramsSearchFields["clinical-status"] = ["clinicalStatus"];
const clinical_statusSearchFunc = {};
clinical_statusSearchFunc["clinicalStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["clinical-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "clinical-status", clinical_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region criticality
paramsSearchFields["criticality"] = ["criticality"];
const criticalitySearchFunc = {};
criticalitySearchFunc["criticality"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["criticality"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "criticality", criticalitySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region last-date
paramsSearchFields["last-date"] = ["lastOccurrence"];
const last_dateSearchFunc = {};
last_dateSearchFunc["lastOccurrence"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["last-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "last-date", last_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region manifestation
paramsSearchFields["manifestation"] = ["reaction.manifestation"];
const manifestationSearchFunc = {};
manifestationSearchFunc["reaction.manifestation"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["manifestation"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "manifestation", manifestationSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region onset
paramsSearchFields["onset"] = ["reaction.onset"];
const onsetSearchFunc = {};
onsetSearchFunc["reaction.onset"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["onset"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "onset", onsetSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region recorder
paramsSearchFields["recorder"] = ["recorder.reference"];
paramsSearch["recorder"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "recorder");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region route
paramsSearchFields["route"] = ["reaction.exposureRoute"];
const routeSearchFunc = {};
routeSearchFunc["reaction.exposureRoute"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["route"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "route", routeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region severity
paramsSearchFields["severity"] = ["reaction.severity"];
const severitySearchFunc = {};
severitySearchFunc["reaction.severity"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["severity"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "severity", severitySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region verification-status
paramsSearchFields["verification-status"] = ["verificationStatus"];
const verification_statusSearchFunc = {};
verification_statusSearchFunc["verificationStatus"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["verification-status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "verification-status", verification_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;