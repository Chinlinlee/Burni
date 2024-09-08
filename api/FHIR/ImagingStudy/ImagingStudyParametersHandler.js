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
//#region basedon
paramsSearchFields["basedon"] = ["basedOn.reference"];
paramsSearch["basedon"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "basedon");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region bodysite
paramsSearchFields["bodysite"] = ["series.bodySite"];
const bodysiteSearchFunc = {};
bodysiteSearchFunc["series.bodySite"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
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
//#region dicom-class
paramsSearchFields["dicom-class"] = ["series.instance.sopClass"];
const dicom_classSearchFunc = {};
dicom_classSearchFunc["series.instance.sopClass"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["dicom-class"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "dicom-class", dicom_classSearchFunc);
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
//#region endpoint
paramsSearchFields["endpoint"] = ["endpoint.reference", "series.endpoint.reference"];
paramsSearch["endpoint"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "endpoint");
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
//#region instance
paramsSearchFields["instance"] = ["series.instance.uid"];
const instanceSearchFunc = {};
instanceSearchFunc["series.instance.uid"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["instance"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "instance", instanceSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region interpreter
paramsSearchFields["interpreter"] = ["interpreter.reference"];
paramsSearch["interpreter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "interpreter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region modality
paramsSearchFields["modality"] = ["series.modality"];
const modalitySearchFunc = {};
modalitySearchFunc["series.modality"] = (item, field) => {
    return queryBuild.tokenQuery(item, "code", field, "", false);
};

paramsSearch["modality"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "modality", modalitySearchFunc);
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
paramsSearchFields["performer"] = ["series.performer.actor.reference"];
paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region reason
paramsSearchFields["reason"] = ["reasonCode"];
const reasonSearchFunc = {};
reasonSearchFunc["reasonCode"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "reason", reasonSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region referrer
paramsSearchFields["referrer"] = ["referrer.reference"];
paramsSearch["referrer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "referrer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region series
paramsSearchFields["series"] = ["series.uid"];
const seriesSearchFunc = {};
seriesSearchFunc["series.uid"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["series"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "series", seriesSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region started
paramsSearchFields["started"] = ["started"];
const startedSearchFunc = {};
startedSearchFunc["started"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["started"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "started", startedSearchFunc);
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