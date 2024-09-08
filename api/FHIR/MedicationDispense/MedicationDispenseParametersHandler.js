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
paramsSearchFields["code"] = ["medicationCodeableConcept"];
const codeSearchFunc = {};
codeSearchFunc["medicationCodeableConcept"] = (item, field) => {
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
//#region context
paramsSearchFields["context"] = ["context.reference"];
paramsSearch["context"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "context");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region destination
paramsSearchFields["destination"] = ["destination.reference"];
paramsSearch["destination"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "destination");
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
//#region medication
paramsSearchFields["medication"] = ["medicationReference.reference"];
paramsSearch["medication"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "medication");
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
paramsSearchFields["performer"] = ["performer.actor.reference"];
paramsSearch["performer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "performer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region prescription
paramsSearchFields["prescription"] = ["authorizingPrescription.reference"];
paramsSearch["prescription"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "prescription");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region receiver
paramsSearchFields["receiver"] = ["receiver.reference"];
paramsSearch["receiver"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "receiver");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region responsibleparty
paramsSearchFields["responsibleparty"] = ["substitution.responsibleParty.reference"];
paramsSearch["responsibleparty"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "responsibleparty");
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
//#region whenhandedover
paramsSearchFields["whenhandedover"] = ["whenHandedOver"];
const whenhandedoverSearchFunc = {};
whenhandedoverSearchFunc["whenHandedOver"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["whenhandedover"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "whenhandedover", whenhandedoverSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region whenprepared
paramsSearchFields["whenprepared"] = ["whenPrepared"];
const whenpreparedSearchFunc = {};
whenpreparedSearchFunc["whenPrepared"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["whenprepared"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "whenprepared", whenpreparedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;