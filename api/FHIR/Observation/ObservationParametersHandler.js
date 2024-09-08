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
//#region combo-code
paramsSearchFields["combo-code"] = ["code", "component.code"];
const combo_codeSearchFunc = {};
combo_codeSearchFunc["code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

combo_codeSearchFunc["component.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["combo-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "combo-code", combo_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region combo-data-absent-reason
paramsSearchFields["combo-data-absent-reason"] = ["dataAbsentReason", "component.dataAbsentReason"];
const combo_data_absent_reasonSearchFunc = {};
combo_data_absent_reasonSearchFunc["dataAbsentReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

combo_data_absent_reasonSearchFunc["component.dataAbsentReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["combo-data-absent-reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "combo-data-absent-reason", combo_data_absent_reasonSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region combo-value-concept
paramsSearchFields["combo-value-concept"] = ["valueCodeableConcept", "component.valueCodeableConcept"];
const combo_value_conceptSearchFunc = {};
combo_value_conceptSearchFunc["valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

combo_value_conceptSearchFunc["component.valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["combo-value-concept"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "combo-value-concept", combo_value_conceptSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region combo-value-quantity
paramsSearchFields["combo-value-quantity"] = ["valueQuantity", "valueSampledData", "component.valueQuantity", "component.valueSampledData"];
paramsSearch["combo-value-quantity"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "combo-value-quantity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region component-code
paramsSearchFields["component-code"] = ["component.code"];
const component_codeSearchFunc = {};
component_codeSearchFunc["component.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["component-code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "component-code", component_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region component-data-absent-reason
paramsSearchFields["component-data-absent-reason"] = ["component.dataAbsentReason"];
const component_data_absent_reasonSearchFunc = {};
component_data_absent_reasonSearchFunc["component.dataAbsentReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["component-data-absent-reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "component-data-absent-reason", component_data_absent_reasonSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region component-value-concept
paramsSearchFields["component-value-concept"] = ["component.valueCodeableConcept"];
const component_value_conceptSearchFunc = {};
component_value_conceptSearchFunc["component.valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["component-value-concept"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "component-value-concept", component_value_conceptSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region component-value-quantity
paramsSearchFields["component-value-quantity"] = ["component.valueQuantity", "component.valueSampledData"];
paramsSearch["component-value-quantity"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "component-value-quantity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region data-absent-reason
paramsSearchFields["data-absent-reason"] = ["dataAbsentReason"];
const data_absent_reasonSearchFunc = {};
data_absent_reasonSearchFunc["dataAbsentReason"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["data-absent-reason"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "data-absent-reason", data_absent_reasonSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region date
paramsSearchFields["date"] = ["effectiveDateTime", "effectiveInstant", "effectivePeriod", "effectiveTiming"];
const dateSearchFunc = {};
dateSearchFunc["effectiveDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

dateSearchFunc["effectiveInstant"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
};

dateSearchFunc["effectivePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

dateSearchFunc["effectiveTiming"] = (value, field) => {
    return queryBuild.timingQuery(value, field);
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
//#region derived-from
paramsSearchFields["derived-from"] = ["derivedFrom.reference"];
paramsSearch["derived-from"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "derived-from");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region device
paramsSearchFields["device"] = ["device.reference"];
paramsSearch["device"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "device");
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
//#region has-member
paramsSearchFields["has-member"] = ["hasMember.reference"];
paramsSearch["has-member"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "has-member");
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
//#region method
paramsSearchFields["method"] = ["method"];
const methodSearchFunc = {};
methodSearchFunc["method"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["method"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "method", methodSearchFunc);
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
//#region value-concept
paramsSearchFields["value-concept"] = ["valueCodeableConcept"];
const value_conceptSearchFunc = {};
value_conceptSearchFunc["valueCodeableConcept"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["value-concept"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "value-concept", value_conceptSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region value-date
paramsSearchFields["value-date"] = ["valueDateTime", "valuePeriod"];
const value_dateSearchFunc = {};
value_dateSearchFunc["valueDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

value_dateSearchFunc["valuePeriod"] = (value, field) => {
    return queryBuild.periodQuery(value, field);
};

paramsSearch["value-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "value-date", value_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region value-quantity
paramsSearchFields["value-quantity"] = ["valueQuantity", "valueSampledData"];
paramsSearch["value-quantity"] = (query) => {
    try {
        queryHandler.getQuantityQuery(query, paramsSearchFields, "value-quantity");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#region value-string
paramsSearchFields["value-string"] = ["valueString", "valueCodeableConcept.text"];
paramsSearchFields["value-string:contains"] = paramsSearchFields["value-string"];
paramsSearchFields["value-string:exact"] = paramsSearchFields["value-string"];
paramsSearch["value-string"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "value-string");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["value-string:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "value-string:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["value-string:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "value-string:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;