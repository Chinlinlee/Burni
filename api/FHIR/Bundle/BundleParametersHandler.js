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
//#region composition
paramsSearchFields["composition"] = ["entry.0.resource.reference"];
paramsSearch["composition"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.encounter
paramsSearchFields["composition.encounter"] = ["entry.0.resource.encounter.reference"];
paramsSearch["composition.encounter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.encounter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.attester
paramsSearchFields["composition.attester"] = ["entry.0.resource.attester.party.reference"];
paramsSearch["composition.attester"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.attester");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.author
paramsSearchFields["composition.author"] = ["entry.0.resource.author.reference"];
paramsSearch["composition.author"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.author");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.category
paramsSearchFields["composition.category"] = ["entry.0.resource.category"];
const composition_categorySearchFunc = {};
composition_categorySearchFunc["entry.0.resource.category"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.category"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.category", composition_categorySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.confidentiality
paramsSearchFields["composition.confidentiality"] = ["entry.0.resource.confidentiality"];
const composition_confidentialitySearchFunc = {};
composition_confidentialitySearchFunc["entry.0.resource.confidentiality"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.confidentiality"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.confidentiality", composition_confidentialitySearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.context
paramsSearchFields["composition.context"] = ["entry.0.resource.event.code"];
const composition_contextSearchFunc = {};
composition_contextSearchFunc["entry.0.resource.event.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.context"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.context", composition_contextSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.date
paramsSearchFields["composition.date"] = ["entry.0.resource.date"];
const composition_dateSearchFunc = {};
paramsSearch["composition.date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "composition.date", composition_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.entry
paramsSearchFields["composition.entry"] = ["entry.0.resource.section.entry.reference"];
paramsSearch["composition.entry"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.entry");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.identifier
paramsSearchFields["composition.identifier"] = ["entry.0.resource.identifier"];
const composition_identifierSearchFunc = {};
composition_identifierSearchFunc["entry.0.resource.identifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.identifier"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.identifier", composition_identifierSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.patient
paramsSearchFields["composition.patient"] = ["entry.0.resource.subject.reference"];
paramsSearch["composition.patient"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.patient");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.period
paramsSearchFields["composition.period"] = ["entry.0.resource.event.period"];
const composition_periodSearchFunc = {};
paramsSearch["composition.period"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "composition.period", composition_periodSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.related-id
paramsSearchFields["composition.related-id"] = ["entry.0.resource.relatesTo.targetIdentifier"];
const composition_related_idSearchFunc = {};
composition_related_idSearchFunc["entry.0.resource.relatesTo.targetIdentifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.related-id"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.related-id", composition_related_idSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.related-ref
paramsSearchFields["composition.related-ref"] = ["entry.0.resource.relatesTo.targetReference.reference"];
paramsSearch["composition.related-ref"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.related-ref");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.section
paramsSearchFields["composition.section"] = ["entry.0.resource.section.code"];
const composition_sectionSearchFunc = {};
composition_sectionSearchFunc["entry.0.resource.section.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.section"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.section", composition_sectionSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.status
paramsSearchFields["composition.status"] = ["entry.0.resource.status"];
const composition_statusSearchFunc = {};
composition_statusSearchFunc["entry.0.resource.status"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.status"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.status", composition_statusSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.subject
paramsSearchFields["composition.subject"] = ["entry.0.resource.subject.reference"];
paramsSearch["composition.subject"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "composition.subject");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.title
paramsSearchFields["composition.title"] = ["entry.0.resource.title"];
paramsSearchFields["composition.title:contains"] = paramsSearchFields["composition.title"];
paramsSearchFields["composition.title:exact"] = paramsSearchFields["composition.title"];
paramsSearch["composition.title"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "composition.title");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["composition.title:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "composition.title:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["composition.title:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "composition.title:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region composition.type
paramsSearchFields["composition.type"] = ["entry.0.resource.type"];
const composition_typeSearchFunc = {};
composition_typeSearchFunc["entry.0.resource.type"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["composition.type"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "composition.type", composition_typeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.author
paramsSearchFields["message.author"] = ["entry.0.resource.author.reference"];
paramsSearch["message.author"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.author");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.code
paramsSearchFields["message.code"] = ["entry.0.resource.response.code"];
const message_codeSearchFunc = {};
message_codeSearchFunc["entry.0.resource.response.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["message.code"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "message.code", message_codeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.destination
paramsSearchFields["message.destination"] = ["entry.0.resource.destination.name"];
paramsSearchFields["message.destination:contains"] = paramsSearchFields["message.destination"];
paramsSearchFields["message.destination:exact"] = paramsSearchFields["message.destination"];
paramsSearch["message.destination"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.destination");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["message.destination:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.destination:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["message.destination:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.destination:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.enterer
paramsSearchFields["message.enterer"] = ["entry.0.resource.enterer.reference"];
paramsSearch["message.enterer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.enterer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.event
paramsSearchFields["message.event"] = ["entry.0.resource.event"];
const message_eventSearchFunc = {};
message_eventSearchFunc["entry.0.resource.event"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["message.event"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "message.event", message_eventSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.focus
paramsSearchFields["message.focus"] = ["entry.0.resource.focus.reference"];
paramsSearch["message.focus"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.focus");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.receiver
paramsSearchFields["message.receiver"] = ["entry.0.resource.destination.receiver.reference"];
paramsSearch["message.receiver"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.receiver");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.response-id
paramsSearchFields["message.response-id"] = ["entry.0.resource.response.identifier"];
const message_response_idSearchFunc = {};
message_response_idSearchFunc["entry.0.resource.response.identifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["message.response-id"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "message.response-id", message_response_idSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.responsible
paramsSearchFields["message.responsible"] = ["entry.0.resource.responsible.reference"];
paramsSearch["message.responsible"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.responsible");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.sender
paramsSearchFields["message.sender"] = ["entry.0.resource.sender.reference"];
paramsSearch["message.sender"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.sender");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.source
paramsSearchFields["message.source"] = ["entry.0.resource.source.name"];
paramsSearchFields["message.source:contains"] = paramsSearchFields["message.source"];
paramsSearchFields["message.source:exact"] = paramsSearchFields["message.source"];
paramsSearch["message.source"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.source");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["message.source:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.source:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["message.source:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "message.source:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region message.target
paramsSearchFields["message.target"] = ["entry.0.resource.destination.target.reference"];
paramsSearch["message.target"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message.target");
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
//#region message
paramsSearchFields["message"] = ["entry.0.resource.reference"];
paramsSearch["message"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "message");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region timestamp
paramsSearchFields["timestamp"] = ["timestamp"];
const timestampSearchFunc = {};
timestampSearchFunc["timestamp"] = (value, field) => {
    return queryBuild.instantQuery(value, field);
};

paramsSearch["timestamp"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "timestamp", timestampSearchFunc);
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;