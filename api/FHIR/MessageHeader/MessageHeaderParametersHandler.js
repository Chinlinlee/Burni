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
//#region author
paramsSearchFields["author"] = ["author.reference"];
paramsSearch["author"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "author");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region code
paramsSearchFields["code"] = ["response.code"];
const codeSearchFunc = {};
codeSearchFunc["response.code"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
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
//#region destination
paramsSearchFields["destination"] = ["destination.name"];
paramsSearchFields["destination:contains"] = paramsSearchFields["destination"];
paramsSearchFields["destination:exact"] = paramsSearchFields["destination"];
paramsSearch["destination"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "destination");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["destination:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "destination:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["destination:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "destination:exact");
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
//#region event
paramsSearchFields["event"] = ["event"];
const eventSearchFunc = {};
eventSearchFunc["event"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["event"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "event", eventSearchFunc);
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
//#region receiver
paramsSearchFields["receiver"] = ["destination.receiver.reference"];
paramsSearch["receiver"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "receiver");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region response-id
paramsSearchFields["response-id"] = ["response.identifier"];
const response_idSearchFunc = {};
response_idSearchFunc["response.identifier"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["response-id"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "response-id", response_idSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region responsible
paramsSearchFields["responsible"] = ["responsible.reference"];
paramsSearch["responsible"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "responsible");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region sender
paramsSearchFields["sender"] = ["sender.reference"];
paramsSearch["sender"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "sender");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region source
paramsSearchFields["source"] = ["source.name"];
paramsSearchFields["source:contains"] = paramsSearchFields["source"];
paramsSearchFields["source:exact"] = paramsSearchFields["source"];
paramsSearch["source"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "source");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["source:contains"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "source:contains");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
paramsSearch["source:exact"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "source:exact");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region target
paramsSearchFields["target"] = ["destination.target.reference"];
paramsSearch["target"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "target");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion

module.exports.paramsSearch = paramsSearch;
module.exports.paramsSearchFields = paramsSearchFields;