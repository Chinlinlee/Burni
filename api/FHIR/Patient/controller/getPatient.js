const _ = require('lodash');
const mongodb = require('models/mongodb');
const {
    createBundle
} = require('models/FHIR/func');
const queryBuild = require('models/FHIR/queryBuild.js');
const {
    handleError
} = require('models/FHIR/httpMessage');

module.exports = async function(req, res) {
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    let realLimit = paginationLimit + paginationSkip;
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    Object.keys(queryParameter).forEach(key => {
        if (!queryParameter[key] || _.isObject(queryParameter[key])) {
            delete queryParameter[key];
        }
    });
    queryParameter.$and = [];
    for (let key in queryParameter) {
        try {
            paramsSearch[key](queryParameter);
        } catch (e) {
            if (key != "$and") {
                console.error(e);
                return res.status(400).send(handleError.processing(`Unknown search parameter ${key} or value ${queryParameter[key]}`))
            }
        }
    }
    if (queryParameter.$and.length == 0) {
        delete queryParameter["$and"];
    }
    try {
        let docs = await mongodb.Patient.find(queryParameter).
        limit(realLimit).
        skip(paginationSkip).
        exec();
        docs = docs.map(v => {
            return v.getFHIRField();
        });
        let count = await mongodb.Patient.countDocuments(queryParameter);
        let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, "Patient");
        return res.status(200).json(bundle);
    } catch (e) {
        console.log('api api/fhir/Patient/ has error, ', e)
        return res.status(500).json({
            message: 'server has something error'
        });
    }
};

const paramsSearch = {
    "_id": (query) => {
        query.$and.push({
            id: query["_id"]
        });
        delete query["_id"];
    }
}
paramsSearch["address"] = (query) => {
    let buildResult = queryBuild.addressQuery(query["address"], "address");
    query.$and.push(buildResult);
    delete query[address];
}
paramsSearch["address-city"] = (query) => {
    let buildResult = queryBuild.addressQuery(query["address-city"], "address.city");
    query.$and.push(buildResult);
    delete query[address - city];
}
paramsSearch["address-country"] = (query) => {
    let buildResult = queryBuild.addressQuery(query["address-country"], "address.country");
    query.$and.push(buildResult);
    delete query[address - country];
}
paramsSearch["address-postalcode"] = (query) => {
    let buildResult = queryBuild.addressQuery(query["address-postalcode"], "address.postalCode");
    query.$and.push(buildResult);
    delete query[address - postalcode];
}
paramsSearch["address-state"] = (query) => {
    let buildResult = queryBuild.addressQuery(query["address-state"], "address.state");
    query.$and.push(buildResult);
    delete query[address - state];
}
paramsSearch["address-use"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["address-use"], "", "address.use", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
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
paramsSearch["email"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["email"], "value", "telecom", "email");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['email'];
}
paramsSearch["family"] = (query) => {
    queryBuild.arrayStringBuild(query, "family", "name.family", ["family"]);
}
paramsSearch["gender"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["gender"], "", "gender", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['gender'];
}
paramsSearch["given"] = (query) => {
    queryBuild.arrayStringBuild(query, "given", "name.given", ["given"]);
}
paramsSearch["phone"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["phone"], "value", "telecom", "phone");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['phone'];
}
paramsSearch["phonetic"] = (query) => {
    queryBuild.arrayStringBuild(query, "phonetic", "name", ["phonetic"]);
}
paramsSearch["telecom"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["telecom"], "", "telecom", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['telecom'];
}
paramsSearch["active"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["active"], "", "active", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['active'];
}
paramsSearch["deceased"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["deceased"], "", "deceased.exists() and Patient.deceased != false", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['deceased'];
}
paramsSearch["identifier"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["identifier"], "value", "identifier", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['identifier'];
}
paramsSearch["language"] = (query) => {
    let buildResult = queryBuild.tokenQuery(query["language"], "", "communication.language", "");
    for (let i in buildResult) {
        query.$and.push({
            [i]: buildResult[i]
        });
    }
    delete query['language'];
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