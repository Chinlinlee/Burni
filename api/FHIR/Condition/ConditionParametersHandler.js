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
//#region abatement-age
paramsSearchFields["abatement-age"] = ["abatementAge", "abatementRange"];
paramsSearch["abatement-age"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "abatement-age");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region abatement-date
paramsSearchFields["abatement-date"] = ["abatementDateTime", "abatementPeriod"];
const abatement_dateSearchFunc = {};
abatement_dateSearchFunc["abatementDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

abatement_dateSearchFunc["abatementPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["abatement-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "abatement-date", abatement_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region abatement-string
paramsSearchFields["abatement-string"] = ["abatementString"];
paramsSearchFields["abatement-string:contains"] = paramsSearchFields["abatement-string"];
paramsSearchFields["abatement-string:exact"] = paramsSearchFields["abatement-string"];
paramsSearch["abatement-string"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "abatement-string");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["abatement-string:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "abatement-string:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["abatement-string:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "abatement-string:exact");
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
//#region evidence
paramsSearchFields["evidence"] = ["evidence.code"];
const evidenceSearchFunc = {};
evidenceSearchFunc["evidence.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["evidence"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "evidence", evidenceSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region evidence-detail
paramsSearchFields["evidence-detail"] = ["evidence.detail.reference"];
paramsSearch["evidence-detail"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "evidence-detail");
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
//#region onset-age
paramsSearchFields["onset-age"] = ["onsetAge", "onsetRange"];
paramsSearch["onset-age"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "onset-age");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region onset-date
paramsSearchFields["onset-date"] = ["onsetDateTime", "onsetPeriod"];
const onset_dateSearchFunc = {};
onset_dateSearchFunc["onsetDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

onset_dateSearchFunc["onsetPeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["onset-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "onset-date", onset_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region onset-info
paramsSearchFields["onset-info"] = ["onsetString"];
paramsSearchFields["onset-info:contains"] = paramsSearchFields["onset-info"];
paramsSearchFields["onset-info:exact"] = paramsSearchFields["onset-info"];
paramsSearch["onset-info"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "onset-info");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["onset-info:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "onset-info:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["onset-info:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "onset-info:exact");
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
//#region recorded-date
paramsSearchFields["recorded-date"] = ["recordedDate"];
const recorded_dateSearchFunc = {};
recorded_dateSearchFunc["recordedDate"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["recorded-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "recorded-date", recorded_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region severity
paramsSearchFields["severity"] = ["severity"];
const severitySearchFunc = {};
severitySearchFunc["severity"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
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
//#region stage
paramsSearchFields["stage"] = ["stage.summary"];
const stageSearchFunc = {};
stageSearchFunc["stage.summary"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["stage"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "stage", stageSearchFunc);
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