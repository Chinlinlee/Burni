const _ = require('lodash');
const mongodb = require('models/mongodb');
const {
    createBundle
} = require('models/FHIR/func');
const queryBuild = require('models/FHIR/queryBuild.js');
const {
    handleError
} = require('models/FHIR/httpMessage');
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
paramsSearchFields["address"] = ["address"];
paramsSearch["address"] = (query) => {
    if (!_.isArray(query["address"])) {
        query["address"] = [query["address"]];
    }
    for (let item of query["address"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address"];
};
paramsSearchFields["address-city"] = ["address.city"];
paramsSearch["address-city"] = (query) => {
    if (!_.isArray(query["address-city"])) {
        query["address-city"] = [query["address-city"]];
    }
    for (let item of query["address-city"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address-city"];
};
paramsSearchFields["address-country"] = ["address.country"];
paramsSearch["address-country"] = (query) => {
    if (!_.isArray(query["address-country"])) {
        query["address-country"] = [query["address-country"]];
    }
    for (let item of query["address-country"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address-country"];
};
paramsSearchFields["address-postalcode"] = ["address.postalCode"];
paramsSearch["address-postalcode"] = (query) => {
    if (!_.isArray(query["address-postalcode"])) {
        query["address-postalcode"] = [query["address-postalcode"]];
    }
    for (let item of query["address-postalcode"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address-postalcode"];
};
paramsSearchFields["address-state"] = ["address.state"];
paramsSearch["address-state"] = (query) => {
    if (!_.isArray(query["address-state"])) {
        query["address-state"] = [query["address-state"]];
    }
    for (let item of query["address-state"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address-state"];
};
paramsSearchFields["birthdate"] = ["birthDate"];
const birthdateSearchFunc = {};
birthdateSearchFunc["birthDate"] = (value, field) => {
    return queryBuild.dateQuery(value, field);
};

paramsSearch["birthdate"] = (query) => {
    if (!_.isArray(query["birthdate"])) {
        query["birthdate"] = [query["birthdate"]];
    }
    for (let item of query["birthdate"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["birthdate"]) {
            let buildResult = birthdateSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['birthdate'];
};
paramsSearchFields["email"] = ["telecom.where(system='email')"];
paramsSearch["email"] = (query) => {
    if (!_.isArray(query["email"])) {
        query["email"] = [query["email"]];
    }
    for (let item of query["email"]) {
        let buildResult = queryBuild.tokenQuery(item, "value", "telecom", "email", false);
        for (let i in buildResult) {
            query.$and.push({
                [i]: buildResult[i]
            });
        }
    }
    delete query['email'];
};
paramsSearchFields["family"] = ["name.family"];
paramsSearch["family"] = (query) => {
    if (!_.isArray(query["family"])) {
        query["family"] = [query["family"]];
    }
    for (let item of query["family"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["family"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['family'];
};
paramsSearchFields["given"] = ["name.given"];
paramsSearch["given"] = (query) => {
    if (!_.isArray(query["given"])) {
        query["given"] = [query["given"]];
    }
    for (let item of query["given"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["given"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['given'];
};
paramsSearchFields["phone"] = ["telecom.where(system='phone')"];
paramsSearch["phone"] = (query) => {
    if (!_.isArray(query["phone"])) {
        query["phone"] = [query["phone"]];
    }
    for (let item of query["phone"]) {
        let buildResult = queryBuild.tokenQuery(item, "value", "telecom", "phone", false);
        for (let i in buildResult) {
            query.$and.push({
                [i]: buildResult[i]
            });
        }
    }
    delete query['phone'];
};
paramsSearchFields["phonetic"] = ["name"];
paramsSearch["phonetic"] = (query) => {
    if (!_.isArray(query["phonetic"])) {
        query["phonetic"] = [query["phonetic"]];
    }
    for (let item of query["phonetic"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["phonetic"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['phonetic'];
};
paramsSearchFields["death-date"] = ["deceasedDateTime"];
const death_dateSearchFunc = {};
death_dateSearchFunc["deceasedDateTime"] = (value, field) => {
    return queryBuild.dateTimeQuery(value, field);
};

paramsSearch["death-date"] = (query) => {
    if (!_.isArray(query["death-date"])) {
        query["death-date"] = [query["death-date"]];
    }
    for (let item of query["death-date"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["death-date"]) {
            let buildResult = death_dateSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['death-date'];
};
paramsSearchFields["general-practitioner"] = ["generalPractitioner.reference"];
paramsSearch["general-practitioner"] = (query) => {
    if (!_.isArray(query["general-practitioner"])) {
        query["general-practitioner"] = [query["general-practitioner"]];
    }

    for (let item of query["general-practitioner"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["general-practitioner"]) {
            let buildResult = queryBuild.referenceQuery(item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['general-practitioner'];
};
paramsSearchFields["identifier"] = ["identifier"];
paramsSearch["identifier"] = (query) => {
    if (!_.isArray(query["identifier"])) {
        query["identifier"] = [query["identifier"]];
    }
    for (let item of query["identifier"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["identifier"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['identifier'];
};
paramsSearchFields["link"] = ["link.other.reference"];
paramsSearch["link"] = (query) => {
    if (!_.isArray(query["link"])) {
        query["link"] = [query["link"]];
    }

    for (let item of query["link"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["link"]) {
            let buildResult = queryBuild.referenceQuery(item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['link'];
};
paramsSearchFields["name"] = ["name"];
paramsSearch["name"] = (query) => {
    if (!_.isArray(query["name"])) {
        query["name"] = [query["name"]];
    }
    for (let item of query["name"]) {
        let buildResult = queryBuild.nameQuery(item, "name");
        query.$and.push(buildResult);
    }
    delete query['name'];
};
paramsSearchFields["organization"] = ["managingOrganization.reference"];
paramsSearch["organization"] = (query) => {
    if (!_.isArray(query["organization"])) {
        query["organization"] = [query["organization"]];
    }

    for (let item of query["organization"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["organization"]) {
            let buildResult = queryBuild.referenceQuery(item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['organization'];
};