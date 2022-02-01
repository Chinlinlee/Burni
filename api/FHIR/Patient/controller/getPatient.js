const _ = require('lodash');
const queryBuild = require('../../../../models/FHIR/queryBuild.js');
const queryHandler = require('../../../../models/FHIR/searchParameterQueryHandler');
const search = require('../../../FHIRApiService/search');

module.exports = async function(req, res) {
    return await search(req, res, "Patient", paramsSearch);
};
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
paramsSearchFields["address"] = ["address"];
paramsSearch["address"] = (query) => {
    try {
        queryHandler.getAddressQuery(query, paramsSearchFields);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-city
paramsSearchFields["address-city"] = ["address.city"];
paramsSearch["address-city"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-city");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-country
paramsSearchFields["address-country"] = ["address.country"];
paramsSearch["address-country"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-country");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-postalcode
paramsSearchFields["address-postalcode"] = ["address.postalCode"];
paramsSearch["address-postalcode"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-postalcode");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-state
paramsSearchFields["address-state"] = ["address.state"];
paramsSearch["address-state"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "address-state");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region address-use
paramsSearchFields["address-use"] = ["address.use"];
const address_useSearchFunc = {};
address_useSearchFunc["address.use"] = (item, field) => {
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
//#region birthdate
paramsSearchFields["birthdate"] = ["birthDate"];
const birthdateSearchFunc = {};
birthdateSearchFunc["birthDate"] = (value, field) => {
    return queryBuild.dateQuery(value, field);
};

paramsSearch["birthdate"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "birthdate", birthdateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region email
paramsSearchFields["email"] = ["telecom"];
paramsSearch["email"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "email");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region family
paramsSearchFields["family"] = ["name.family"];
paramsSearch["family"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "family");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region gender
paramsSearchFields["gender"] = ["gender"];
const genderSearchFunc = {};
genderSearchFunc["gender"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["gender"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "gender", genderSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region given
paramsSearchFields["given"] = ["name.given"];
paramsSearch["given"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "given");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region phone
paramsSearchFields["phone"] = ["telecom"];
paramsSearch["phone"] = (query) => {
    try {
        queryHandler.getTokenQuery(query, paramsSearchFields, "phone");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region phonetic
paramsSearchFields["phonetic"] = ["name"];
paramsSearch["phonetic"] = (query) => {
    try {
        queryHandler.getStringQuery(query, paramsSearchFields, "phonetic");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region telecom
paramsSearchFields["telecom"] = ["telecom"];
const telecomSearchFunc = {};
telecomSearchFunc["telecom"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["telecom"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "telecom", telecomSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region active
paramsSearchFields["active"] = ["active"];
const activeSearchFunc = {};
activeSearchFunc["active"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["active"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "active", activeSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region death-date
paramsSearchFields["death-date"] = ["deceasedDateTime"];
const death_dateSearchFunc = {};
death_dateSearchFunc["deceasedDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["death-date"] = (query) => {
    try {
        queryHandler.getPolyDateQuery(query, paramsSearchFields, "death-date", death_dateSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region deceased
paramsSearchFields["deceased"] = ["deceasedBoolean"];
const deceasedSearchFunc = {};
deceasedSearchFunc["deceasedBoolean"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["deceased"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "deceased", deceasedSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region general-practitioner
paramsSearchFields["general-practitioner"] = ["generalPractitioner.reference"];
paramsSearch["general-practitioner"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "general-practitioner");
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
//#region language
paramsSearchFields["language"] = ["communication.language"];
const languageSearchFunc = {};
languageSearchFunc["communication.language"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["language"] = (query) => {
    try {
        queryHandler.getPolyTokenQuery(query, paramsSearchFields, "language", languageSearchFunc);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region link
paramsSearchFields["link"] = ["link.other.reference"];
paramsSearch["link"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "link");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region name
paramsSearchFields["name"] = ["name"];
paramsSearch["name"] = (query) => {
    try {
        queryHandler.getNameQuery(query, paramsSearchFields);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion
//#region organization
paramsSearchFields["organization"] = ["managingOrganization.reference"];
paramsSearch["organization"] = (query) => {
    try {
        queryHandler.getReferenceQuery(query, paramsSearchFields, "organization");
    } catch (e) {
        console.error(e);
        throw e;
    }
};
//#endregion