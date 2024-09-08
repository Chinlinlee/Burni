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
//#region device-name
paramsSearchFields["device-name"] = ["deviceName.name", "type.coding.display", "type.text"];
paramsSearchFields["device-name:contains"] = paramsSearchFields["device-name"];
paramsSearchFields["device-name:exact"] = paramsSearchFields["device-name"];
paramsSearch["device-name"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "device-name");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["device-name:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "device-name:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["device-name:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "device-name:exact");
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
//#region location
paramsSearchFields["location"] = ["location.reference"];
paramsSearch["location"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "location");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region manufacturer
paramsSearchFields["manufacturer"] = ["manufacturer"];
paramsSearchFields["manufacturer:contains"] = paramsSearchFields["manufacturer"];
paramsSearchFields["manufacturer:exact"] = paramsSearchFields["manufacturer"];
paramsSearch["manufacturer"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "manufacturer");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["manufacturer:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "manufacturer:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["manufacturer:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "manufacturer:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region model
paramsSearchFields["model"] = ["modelNumber"];
paramsSearchFields["model:contains"] = paramsSearchFields["model"];
paramsSearchFields["model:exact"] = paramsSearchFields["model"];
paramsSearch["model"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "model");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["model:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "model:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["model:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "model:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region organization
paramsSearchFields["organization"] = ["owner.reference"];
paramsSearch["organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "organization");
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
//#region udi-carrier
paramsSearchFields["udi-carrier"] = ["udiCarrier.carrierHRF"];
paramsSearchFields["udi-carrier:contains"] = paramsSearchFields["udi-carrier"];
paramsSearchFields["udi-carrier:exact"] = paramsSearchFields["udi-carrier"];
paramsSearch["udi-carrier"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-carrier");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["udi-carrier:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-carrier:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["udi-carrier:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-carrier:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region udi-di
paramsSearchFields["udi-di"] = ["udiCarrier.deviceIdentifier"];
paramsSearchFields["udi-di:contains"] = paramsSearchFields["udi-di"];
paramsSearchFields["udi-di:exact"] = paramsSearchFields["udi-di"];
paramsSearch["udi-di"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-di");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["udi-di:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-di:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["udi-di:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "udi-di:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;