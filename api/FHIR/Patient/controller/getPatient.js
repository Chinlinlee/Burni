const _ = require('lodash');
const queryBuild = require('../../../../models/FHIR/queryBuild.js');
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
    if (!_.isArray(query["address"])) {
        query["address"] = [query["address"]];
    }
    for (let item of query["address"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address"]) {
            let buildResult = queryBuild.addressQuery(item, field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query["address"];
};
//#endregion
//#region address-city
paramsSearchFields["address-city"] = ["address.city"];
paramsSearch["address-city"] = (query) => {
    if (!_.isArray(query["address-city"])) {
        query["address-city"] = [query["address-city"]];
    }
    for (let item of query["address-city"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-city"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-city'];
};
//#endregion
//#region address-country
paramsSearchFields["address-country"] = ["address.country"];
paramsSearch["address-country"] = (query) => {
    if (!_.isArray(query["address-country"])) {
        query["address-country"] = [query["address-country"]];
    }
    for (let item of query["address-country"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-country"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-country'];
};
//#endregion
//#region address-postalcode
paramsSearchFields["address-postalcode"] = ["address.postalCode"];
paramsSearch["address-postalcode"] = (query) => {
    if (!_.isArray(query["address-postalcode"])) {
        query["address-postalcode"] = [query["address-postalcode"]];
    }
    for (let item of query["address-postalcode"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-postalcode"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-postalcode'];
};
//#endregion
//#region address-state
paramsSearchFields["address-state"] = ["address.state"];
paramsSearch["address-state"] = (query) => {
    if (!_.isArray(query["address-state"])) {
        query["address-state"] = [query["address-state"]];
    }
    for (let item of query["address-state"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-state"]) {
            let buildResult = {
                [field]: queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-state'];
};
//#endregion
//#region address-use
paramsSearchFields["address-use"] = ["address.use"];
const address_useSearchFunc = {};
address_useSearchFunc["address.use"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["address-use"] = (query) => {
    if (!_.isArray(query["address-use"])) {
        query["address-use"] = [query["address-use"]];
    }
    for (let item of query["address-use"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["address-use"]) {
            let buildResult = address_useSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['address-use'];
};
//#endregion
//#region birthdate
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
//#endregion
//#region email
paramsSearchFields["email"] = ["telecom"];
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
//#endregion
//#region family
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
//#endregion
//#region gender
paramsSearchFields["gender"] = ["gender"];
const genderSearchFunc = {};
genderSearchFunc["gender"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["gender"] = (query) => {
    if (!_.isArray(query["gender"])) {
        query["gender"] = [query["gender"]];
    }
    for (let item of query["gender"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["gender"]) {
            let buildResult = genderSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['gender'];
};
//#endregion
//#region given
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
//#endregion
//#region phone
paramsSearchFields["phone"] = ["telecom"];
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
//#endregion
//#region phonetic
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
//#endregion
//#region telecom
paramsSearchFields["telecom"] = ["telecom"];
const telecomSearchFunc = {};
telecomSearchFunc["telecom"] = (item, field) => {
    return queryBuild.tokenQuery(item, "value", field, "", false);
};

paramsSearch["telecom"] = (query) => {
    if (!_.isArray(query["telecom"])) {
        query["telecom"] = [query["telecom"]];
    }
    for (let item of query["telecom"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["telecom"]) {
            let buildResult = telecomSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['telecom'];
};
//#endregion
//#region active
paramsSearchFields["active"] = ["active"];
const activeSearchFunc = {};
activeSearchFunc["active"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["active"] = (query) => {
    if (!_.isArray(query["active"])) {
        query["active"] = [query["active"]];
    }
    for (let item of query["active"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["active"]) {
            let buildResult = activeSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['active'];
};
//#endregion
//#region death-date
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
//#endregion
//#region deceased
paramsSearchFields["deceased"] = ["deceasedBoolean"];
const deceasedSearchFunc = {};
deceasedSearchFunc["deceasedBoolean"] = (item, field) => {
    return queryBuild.tokenQuery(item, "", field, "", false);
};

paramsSearch["deceased"] = (query) => {
    if (!_.isArray(query["deceased"])) {
        query["deceased"] = [query["deceased"]];
    }
    for (let item of query["deceased"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["deceased"]) {
            let buildResult = deceasedSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['deceased'];
};
//#endregion
//#region general-practitioner
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
//#endregion
//#region identifier
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
//#endregion
//#region language
paramsSearchFields["language"] = ["communication.language"];
const languageSearchFunc = {};
languageSearchFunc["communication.language"] = (item, field) => {
    return queryBuild.tokenQuery(item, "coding.code", field, "", true);
};

paramsSearch["language"] = (query) => {
    if (!_.isArray(query["language"])) {
        query["language"] = [query["language"]];
    }
    for (let item of query["language"]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields["language"]) {
            let buildResult = languageSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['language'];
};
//#endregion
//#region link
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
//#endregion
//#region name
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
//#endregion
//#region organization
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
//#endregion