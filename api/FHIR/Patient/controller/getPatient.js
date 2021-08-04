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
}
let paramsSearchFields = {};

const paramsSearch = {
    "_id": (query) => {
        query.$and.push({
            id: query["_id"]
        });
        delete query["_id"];
    }
}
paramsSearch["address"] = (query) => {
    if (!_.isArray(query["address"])) {
        query["address"] = [query["address"]]
    }
    for (let item of query["address"]) {
        let buildResult = queryBuild.addressQuery(item, "address");
        query.$and.push(buildResult);
    }
    delete query["address"];
}
paramsSearch["address-city"] = (query) => {
    if (!_.isArray(query["address-city"])) {
        query["address-city"] = [query["address-city"]]
    }
    for (let item of query["address-city"]) {
        let buildResult = queryBuild.addressQuery(item, "address.city");
        query.$and.push(buildResult);
    }
    delete query["address-city"];
}
paramsSearch["address-country"] = (query) => {
    if (!_.isArray(query["address-country"])) {
        query["address-country"] = [query["address-country"]]
    }
    for (let item of query["address-country"]) {
        let buildResult = queryBuild.addressQuery(item, "address.country");
        query.$and.push(buildResult);
    }
    delete query["address-country"];
}
paramsSearch["address-postalcode"] = (query) => {
    if (!_.isArray(query["address-postalcode"])) {
        query["address-postalcode"] = [query["address-postalcode"]]
    }
    for (let item of query["address-postalcode"]) {
        let buildResult = queryBuild.addressQuery(item, "address.postalCode");
        query.$and.push(buildResult);
    }
    delete query["address-postalcode"];
}
paramsSearch["address-state"] = (query) => {
    if (!_.isArray(query["address-state"])) {
        query["address-state"] = [query["address-state"]]
    }
    for (let item of query["address-state"]) {
        let buildResult = queryBuild.addressQuery(item, "address.state");
        query.$and.push(buildResult);
    }
    delete query["address-state"];
}
paramsSearchFields["address-use"] = ["address.use"];
paramsSearch["address-use"] = (query) => {
    if (!_.isArray(query["address-use"])) {
        query["address-use"] = [query["address-use"]]
    }
    for (let item of query["address-use"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-use"]) {
            let buildResult = queryBuild.tokenQuery(item, "", field, false);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-use'];
}
paramsSearch["birthdate"] = (query) => {
    if (!_.isArray(query["birthdate"])) {
        query["birthdate"] = [query["birthdate"]]
    }
    for (let i in query["birthdate"]) {
        let buildResult = queryBuild.dateQuery(query["birthdate"][i], "birthDate");
        if (!buildResult) {
            errorMessage = handleError.processing(`invalid date: ${query["birthdate"]}`)
            throw new Error(errorMessage);
        }
        query.$and.push(buildResult);
    }
    delete query["birthdate"];
}
paramsSearchFields["email"] = ["telecom.where(system='email')"];
paramsSearch["email"] = (query) => {
    if (!_.isArray(query["email"])) {
        query["email"] = [query["email"]]
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
}
paramsSearch["family"] = (query) => {
    queryBuild.arrayStringBuild(query, "family", "name.family", ["family"]);
}
paramsSearchFields["gender"] = ["gender"];
paramsSearch["gender"] = (query) => {
    if (!_.isArray(query["gender"])) {
        query["gender"] = [query["gender"]]
    }
    for (let item of query["gender"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["gender"]) {
            let buildResult = queryBuild.tokenQuery(item, "", field, false);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['gender'];
}
paramsSearch["given"] = (query) => {
    queryBuild.arrayStringBuild(query, "given", "name.given", ["given"]);
}
paramsSearchFields["phone"] = ["telecom.where(system='phone')"];
paramsSearch["phone"] = (query) => {
    if (!_.isArray(query["phone"])) {
        query["phone"] = [query["phone"]]
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
}
paramsSearch["phonetic"] = (query) => {
    queryBuild.arrayStringBuild(query, "phonetic", "name", ["phonetic"]);
}
paramsSearchFields["telecom"] = ["telecom"];
paramsSearch["telecom"] = (query) => {
    if (!_.isArray(query["telecom"])) {
        query["telecom"] = [query["telecom"]]
    }
    for (let item of query["telecom"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["telecom"]) {
            let buildResult = queryBuild.tokenQuery(item, "value", field, false);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['telecom'];
}
paramsSearchFields["active"] = ["active"];
paramsSearch["active"] = (query) => {
    if (!_.isArray(query["active"])) {
        query["active"] = [query["active"]]
    }
    for (let item of query["active"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["active"]) {
            let buildResult = queryBuild.tokenQuery(item, "", field, false);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['active'];
}
paramsSearchFields["deceased"] = ["deceased.exists() and Patient.deceased != false"];
paramsSearch["deceased"] = (query) => {
    if (!_.isArray(query["deceased"])) {
        query["deceased"] = [query["deceased"]]
    }
    for (let item of query["deceased"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["deceased"]) {
            let buildResult = queryBuild.tokenQuery(item, "", field, false);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['deceased'];
}
paramsSearch["general-practitioner"] = (query) => {
    if (!_.isArray(query["general-practitioner"])) {
        query["general-practitioner"] = [query["general-practitioner"]]
    }
    for (let item of query["general-practitioner"]) {
        let buildResult = queryBuild.referenceQuery(item, "generalPractitioner.reference");
        for (let i in buildResult) {
            query.$and.push({
                [i]: buildResult[i]
            });
        }
    }
    delete query['general-practitioner'];
}
paramsSearchFields["identifier"] = ["identifier"];
paramsSearch["identifier"] = (query) => {
    if (!_.isArray(query["identifier"])) {
        query["identifier"] = [query["identifier"]]
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
}
paramsSearchFields["language"] = ["communication.language"];
paramsSearch["language"] = (query) => {
    if (!_.isArray(query["language"])) {
        query["language"] = [query["language"]]
    }
    for (let item of query["language"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["language"]) {
            let buildResult = queryBuild.tokenQuery(item, "coding.code", field, true);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['language'];
}
paramsSearch["link"] = (query) => {
    if (!_.isArray(query["link"])) {
        query["link"] = [query["link"]]
    }
    for (let item of query["link"]) {
        let buildResult = queryBuild.referenceQuery(item, "link.other.reference");
        for (let i in buildResult) {
            query.$and.push({
                [i]: buildResult[i]
            });
        }
    }
    delete query['link'];
}
paramsSearch["name"] = (query) => {
    if (!_.isArray(query["name"])) {
        query["name"] = [query["name"]]
    }
    for (let item of query["name"]) {
        let buildResult = queryBuild.nameQuery(item, "name");
        query.$and.push(buildResult);
    }
    delete query['name'];
}
paramsSearch["organization"] = (query) => {
    if (!_.isArray(query["organization"])) {
        query["organization"] = [query["organization"]]
    }
    for (let item of query["organization"]) {
        let buildResult = queryBuild.referenceQuery(item, "managingOrganization.reference");
        for (let i in buildResult) {
            query.$and.push({
                [i]: buildResult[i]
            });
        }
    }
    delete query['organization'];
}