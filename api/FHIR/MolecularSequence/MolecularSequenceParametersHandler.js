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
//#region chromosome
paramsSearchFields["chromosome"] = ["referenceSeq.chromosome"];
const chromosomeSearchFunc = {};
chromosomeSearchFunc["referenceSeq.chromosome"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["chromosome"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "chromosome", chromosomeSearchFunc);
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
//#region referenceseqid
paramsSearchFields["referenceseqid"] = ["referenceSeq.referenceSeqId"];
const referenceseqidSearchFunc = {};
referenceseqidSearchFunc["referenceSeq.referenceSeqId"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["referenceseqid"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "referenceseqid", referenceseqidSearchFunc);
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
//#region variant-end
paramsSearchFields["variant-end"] = ["variant.end"];
paramsSearch["variant-end"] = (query) => {
    try {
        queryHandler.getNumberQuery(query, paramsSearchFields, "variant-end");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region variant-start
paramsSearchFields["variant-start"] = ["variant.start"];
paramsSearch["variant-start"] = (query) => {
    try {
        queryHandler.getNumberQuery(query, paramsSearchFields, "variant-start");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region window-end
paramsSearchFields["window-end"] = ["referenceSeq.windowEnd"];
paramsSearch["window-end"] = (query) => {
    try {
        queryHandler.getNumberQuery(query, paramsSearchFields, "window-end");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region window-start
paramsSearchFields["window-start"] = ["referenceSeq.windowStart"];
paramsSearch["window-start"] = (query) => {
    try {
        queryHandler.getNumberQuery(query, paramsSearchFields, "window-start");
    } catch (e) {
        console.error(e);
        throw e;
    }
};

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;