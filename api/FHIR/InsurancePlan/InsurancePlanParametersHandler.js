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
//#region address
paramsSearchFields["address"] = ["contact.address"];
paramsSearch["address"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address:contains"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address:exact"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, "address:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-city
paramsSearchFields["address-city"] = ["contact.address.city"];
paramsSearchFields["address-city:contains"] = paramsSearchFields["address-city"];
paramsSearchFields["address-city:exact"] = paramsSearchFields["address-city"];
paramsSearch["address-city"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-city");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-city:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-city:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-city:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-city:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-country
paramsSearchFields["address-country"] = ["contact.address.country"];
paramsSearchFields["address-country:contains"] = paramsSearchFields["address-country"];
paramsSearchFields["address-country:exact"] = paramsSearchFields["address-country"];
paramsSearch["address-country"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-country");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-country:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-country:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-country:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-country:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-postalcode
paramsSearchFields["address-postalcode"] = ["contact.address.postalCode"];
paramsSearchFields["address-postalcode:contains"] = paramsSearchFields["address-postalcode"];
paramsSearchFields["address-postalcode:exact"] = paramsSearchFields["address-postalcode"];
paramsSearch["address-postalcode"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-postalcode");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-postalcode:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-postalcode:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-postalcode:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-postalcode:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-state
paramsSearchFields["address-state"] = ["contact.address.state"];
paramsSearchFields["address-state:contains"] = paramsSearchFields["address-state"];
paramsSearchFields["address-state:exact"] = paramsSearchFields["address-state"];
paramsSearch["address-state"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-state");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-state:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-state:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["address-state:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-state:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-use
paramsSearchFields["address-use"] = ["contact.address.use"];
const address_useSearchFunc = {};
address_useSearchFunc["contact.address.use"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["address-use"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "address-use", address_useSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region administered-by
paramsSearchFields["administered-by"] = ["administeredBy.reference"];
paramsSearch["administered-by"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "administered-by");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region endpoint
paramsSearchFields["endpoint"] = ["endpoint.reference"];
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
//#region owned-by
paramsSearchFields["owned-by"] = ["ownedBy.reference"];
paramsSearch["owned-by"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "owned-by");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region phonetic
paramsSearchFields["phonetic"] = ["name"];
paramsSearchFields["phonetic:contains"] = paramsSearchFields["phonetic"];
paramsSearchFields["phonetic:exact"] = paramsSearchFields["phonetic"];
paramsSearch["phonetic"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "phonetic");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["phonetic:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "phonetic:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["phonetic:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "phonetic:exact");
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

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;