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
//#region care-team
paramsSearchFields["care-team"] = ["careTeam.provider.reference"];
paramsSearch["care-team"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "care-team");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region created
paramsSearchFields["created"] = ["created"];
const createdSearchFunc = {};
createdSearchFunc["created"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["created"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "created", createdSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region detail-udi
paramsSearchFields["detail-udi"] = ["item.detail.udi.reference"];
paramsSearch["detail-udi"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "detail-udi");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region encounter
paramsSearchFields["encounter"] = ["item.encounter.reference"];
paramsSearch["encounter"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "encounter");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region enterer
paramsSearchFields["enterer"] = ["enterer.reference"];
paramsSearch["enterer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "enterer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region facility
paramsSearchFields["facility"] = ["facility.reference"];
paramsSearch["facility"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "facility");
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
//#region insurer
paramsSearchFields["insurer"] = ["insurer.reference"];
paramsSearch["insurer"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "insurer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region item-udi
paramsSearchFields["item-udi"] = ["item.udi.reference"];
paramsSearch["item-udi"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "item-udi");
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
//#region payee
paramsSearchFields["payee"] = ["payee.party.reference"];
paramsSearch["payee"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "payee");
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
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
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
//#region procedure-udi
paramsSearchFields["procedure-udi"] = ["procedure.udi.reference"];
paramsSearch["procedure-udi"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "procedure-udi");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region provider
paramsSearchFields["provider"] = ["provider.reference"];
paramsSearch["provider"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "provider");
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
//#region subdetail-udi
paramsSearchFields["subdetail-udi"] = ["item.detail.subDetail.udi.reference"];
paramsSearch["subdetail-udi"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "subdetail-udi");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region use
paramsSearchFields["use"] = ["use"];
const useSearchFunc = {};
useSearchFunc["use"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["use"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "use", useSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;