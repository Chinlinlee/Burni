const fhirgen = require('./FHIR-mongoose-Models-Generator/resourceGenerator');
const fs = require('fs');
const mkdirp = require('mkdirp');
const beautify = require('js-beautify').js;
const _ = require('lodash');
require('dotenv').config();
const {  capitalizeFirstLetter } = require('normalize-text');

function getDeepKeys(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
        if (typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function (subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

const tokenDataTypes = [
    {
        dataType: "Coding",
        uri: "",
        code: "code"
    },
    {
        dataType: "CodeableConcept",
        uri: "coding.system",
        code: "coding.code"
    },
    {
        dataType: "ContactPoint",
        uri: "",
        code: "value"
    },
    {
        dataType: "Identifier",
        uri: "",
        code: "value"
    },
    {
        dataType: "code",
        uri: "",
        code: ""
    },
    {
        dataType: "string",
        uri: "",
        code: ""
    },
    {
        dataType: "boolean",
        uri: "",
        code: ""
    }
];

const datePrimitiveType = ['instant', 'time', 'dateTime', 'date'];

const genParamFunc = {
    "string": (param, field, schema = {}) => {
        let txt = "";
        let searchFields = field.split("|").map(
            v => v.substr(v.indexOf(".") + 1).trim()
        );
        for (let key in searchFields) {
            let searchField = searchFields[key];
            if (searchField.includes(" as ")) {
                searchField = searchField.replace(")" , "");
                let [field , asType] = searchField.split(" as ");
                asType = capitalizeFirstLetter(asType);
                searchFields[key] = `${field}${asType}`;
            }
        }
        txt += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        if (param.includes('address')) {
            txt += `
                paramsSearch["${param}"] = (query) => {
                    if (!_.isArray(query["${param}"])) {
                        query["${param}"] = [query["${param}"]]
                    }
                    for (let item of query["${param}"]) {
                        let buildQs = {
                            $or : []
                        };
                        for (let field of paramsSearchFields["address"]) {
                            let buildResult = queryBuild.tokenQuery(item , "value" , field);
                            buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                        }
                        query.$and.push({
                            ...buildQs
                        });
                    }
                    delete query["${param}"];
                } 
                `;
        } else if (param == "name") {
            let deepKeys = getDeepKeys(_.cloneDeep(schema));
            let typePath = deepKeys.filter(v =>  v.includes("name") && v.endsWith(".type"));
            typePath = typePath.reduce(function (a, b) {
                return a.length < b.length ? a : b
            })
            let typeOfField = _.get(schema, typePath);
            if (typeOfField == "string") {
                txt += `
                paramsSearch["name"] = (query) => {
                    if (!_.isArray(query["name"])) {
                        query["name"] = [query["name"]]
                    }
                    for (let item of query["name"]) {
                        let buildQs = {
                            $or: []
                        };
                        for (let field of paramsSearchFields["name"]) {
                            let buildResult = {
                                [field] : queryBuild.stringQuery(item, field)
                            }
                            buildQs.$or.push(buildResult);
                        }
                        query.$and.push({
                            ...buildQs
                        });
                    }
                    delete query['name'];
                } 
                `
            } else {
                txt += `
                paramsSearch["name"] = (query) => {
                    if (!_.isArray(query["name"])) {
                        query["name"] = [query["name"]]
                    }
                    for (let item of query["name"]) {
                        let buildResult = queryBuild.nameQuery(item , "name");
                        query.$and.push(buildResult);
                    }
                    delete query['name'];
                }
                `
            }
            
        } else {
            txt += `
            paramsSearch["${param}"] = (query) => {
                if (!_.isArray(query["${param}"])) {
                    query["${param}"] = [query["${param}"]]
                }
                for (let item of query["${param}"]) {
                    let buildQs = {
                        $or: []
                    };
                    for (let field of paramsSearchFields["${param}"]) {
                        let buildResult = {
                            [field] : queryBuild.stringQuery(item, field)
                        }
                        buildQs.$or.push(buildResult);
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['${param}'];
            } 
            `
        }
        return txt;
    },
    "token": (param, field, schema = {}) => {
        let txt = "";
        let searchFields = field.split("|").map(
            v => v.substr(v.indexOf(".") + 1).trim()
        );
        txt += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        if (param == "phone") {
            txt += `
                paramsSearch["phone"] = (query) => {
                    if (!_.isArray(query["phone"])) {
                        query["phone"] = [query["phone"]]
                    }
                    for (let item of query["phone"]) {
                        let buildResult = queryBuild.tokenQuery(item, "value" , "telecom" , "phone", false);
                        for (let i in buildResult) {
                            query.$and.push({
                                [i]: buildResult[i]
                            });
                        }
                    }
                    delete query['phone'];
                }
                `
        } else if (param == "email") {
            txt += `
                paramsSearch["email"] = (query) => {
                    if (!_.isArray(query["email"])) {
                        query["email"] = [query["email"]]
                    }
                    for (let item of query["email"]) {
                        let buildResult =queryBuild.tokenQuery(item , "value" , "telecom" , "email", false);
                        for (let i in buildResult) {
                            query.$and.push({
                                [i]: buildResult[i]
                            });
                        }
                    }
                    delete query['email'];
                }
                `
        } else if (param == "identifier") {
            txt += `
                paramsSearch["identifier"] = (query) => {
                    if (!_.isArray(query["identifier"])) {
                        query["identifier"] = [query["identifier"]]
                    }
                    for (let item of query["identifier"]) {
                        let buildQs = {
                            $or : []
                        };
                        for (let field of paramsSearchFields["identifier"]) {
                            let buildResult =queryBuild.tokenQuery(item , "value" , field);
                            buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                        }
                        query.$and.push({
                            ...buildQs
                        });
                    }
                    delete query['identifier'];
                }
                `
        } else {
            let searchField = searchFields[0];
            let choiceType = "";
            let deepKeys = getDeepKeys(_.cloneDeep(schema));
            if (/\(.*\)/.test(searchField)) {
                choiceType = searchField.substr(searchField.indexOf())
                searchField = searchField.substr(0, searchField.indexOf("."));
            }
            let typePath = deepKeys.filter(v => {
                let fieldNamePath = searchField.split(".");
                return fieldNamePath.every(item => v.includes(item) && v.endsWith(".type"))
            });
            typePath = typePath.reduce(function (a, b) {
                return a.length < b.length ? a : b
            })
            let typeOfField = _.get(schema, typePath);
            if (typeOfField == "object" || typeOfField == "array") {
                let propertiesOfField = _.get(schema, typePath.replace(".type", ".properties")) || _.get(schema, typePath.replace(".type", ".items.properties"));
                let propertiesKeysLength = Object.keys(propertiesOfField).length;
                if (propertiesKeysLength == 3) {
                    typeOfField = "CodeableConcept"
                } else if (propertiesKeysLength == 5) {
                    typeOfField = "Coding"
                } else {
                    typeOfField = "Identifier"
                }
            }
            let hitToken = tokenDataTypes.find(v => v.dataType == typeOfField);
            if (hitToken) {
                let isCodeableConcept = hitToken.dataType == "CodeableConcept";
                txt += `
                    paramsSearch["${param}"] = (query) => {
                        if (!_.isArray(query["${param}"])) {
                            query["${param}"] = [query["${param}"]]
                        }
                        for (let item of query["${param}"]) {
                            let buildQs = {
                                $or : []
                            };
                            for (let field of paramsSearchFields["${param}"]) {
                                let buildResult =queryBuild.tokenQuery(item , "${hitToken.code}" , field, "", ${isCodeableConcept});
                                buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                            }
                            query.$and.push({
                                ...buildQs
                            });
                        }
                        delete query['${param}'];
                    }
                    `;
            } else {
                txt += `
                    paramsSearch["${param}"] = (query) => {
                        if (!_.isArray(query["${param}"])) {
                            query["${param}"] = [query["${param}"]]
                        }
                        for (let item of query["${param}"]) {
                            let buildQs = {
                                $or : []
                            };
                            for (let field of paramsSearchFields["${param}"]) {
                                let buildResult =queryBuild.tokenQuery(item , "" , field, "", false);
                                buildQs.$or = [...buildQs.$or , ...buildResult.$or];
                            }
                            query.$and.push({
                                ...buildQs
                            });
                        }
                        delete query['${param}'];
                    }
                    `;
            }
        }
        return txt;
    },
    "number": (param, field, schema = {}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.`, "");
            fieldInResource = fieldInResource.trim();
            txt += `
            paramsSearch["${param}"] = (query) => {
                let buildResult = numberQuery(item , "${field}");
                query.$and.push({
                    "${fieldInResource}": buildResult
                });
                delete query["${field}"];
            } 
            `
        }
        return txt;
    },
    "date": (param, field, schema = {}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.`, "");
            fieldInResource = fieldInResource.trim();
            if (!fieldInResource.includes(")")) {
                txt += `
                paramsSearch["${param}"] = (query) => {
                    if (!_.isArray(query["${param}"])) {
                        query["${param}"] = [query["${param}"]]
                    }
                    for (let i in query["${param}"]) {
                        let buildResult = queryBuild.dateQuery(query["${param}"][i] , "${fieldInResource}");
                        if (!buildResult) {
                            errorMessage = handleError.processing(\`invalid date: \${query["${param}"]}\`)
                            throw new Error(errorMessage);
                        }
                        query.$and.push(buildResult);
                    }
                    delete query["${param}"];
                }
                `
            } else {
                console.log("date insteadof:", fieldInResource);
                fieldInResource = fieldInResource.substr(0, fieldInResource.indexOf(" as")).replace(/[\(\)]/gm, "");
                let resourceFields = Object.keys(schema.properties);
                let hitTokenFields = resourceFields.filter(v => v.includes(fieldInResource));
                for (let field of hitTokenFields) {
                    let hitDate = datePrimitiveType.includes(schema.properties[field].type);
                    console.log(schema.properties[field].type);
                    console.log(hitDate);
                    if (hitDate) {
                        console.log(field);
                    }
                }
            }
        }
        return txt;
    },
    "reference": (param, field, schema = {}) => {
        let txt = "";
        //let searchFields = field.split("|");
        let searchFields = field.split("|").map(
            v => v.substr(v.indexOf(".") + 1).trim()
        );
        searchFields = searchFields.map(v=> {
            if (v.includes("where")) {
                let lastIndexFieldInField = v.lastIndexOf(".");
                v = v.substring(0, lastIndexFieldInField) + ".reference";
            } else if (v.includes(" as ")) {
                v = v.substr(0, v.indexOf(" as "));
            } else {
                v = v + ".reference";
            }
            return v;
        });
        txt += `paramsSearchFields["${param}"]= ${JSON.stringify(searchFields)};`;
        txt += `
            paramsSearch["${param}"] = (query) => {
                if (!_.isArray(query["${param}"])) {
                    query["${param}"] = [query["${param}"]]
                }
                
                for (let item of query["${param}"]) {
                    let buildQs = {
                        $or : []
                    };
                    for (let field of paramsSearchFields["${param}"]) {
                        let buildResult =queryBuild.referenceQuery(item , field);
                        buildQs.$or.push(buildResult);
                    }
                    query.$and.push({
                        ...buildQs
                    });
                }
                delete query['${param}'];
            }
            `
        return txt;
    }
}


/**
 * 
 * @param {Object} option 
 * @param {Array} option.resources the resources want to use
 * @param {Boolean} option.generateAllResources
 */
function generateAPI(option) {

    for (let res in option) {
        fhirgen(res, { resourcePath: "./models/mongodb/model", typePath: "./models/mongodb/FHIRTypeSchema" });
    }

    for (let res in option) {
        mkdirp.sync(`./api/FHIR/${res}/controller`);

        //#region search
        let get = `
        const _ = require('lodash');
        const mongodb = require('models/mongodb');
        const {createBundle} = require('models/FHIR/func');
        const queryBuild = require('models/FHIR/queryBuild.js');
        const {handleError} = require('models/FHIR/httpMessage');
        const search = require('../../../FHIRApiService/search');

        module.exports = async function(req, res) {
            return await search(req, res,"${res}", paramsSearch);
        }
        let paramsSearchFields = {};

        const paramsSearch = {
            "_id" : (query) => {
                query.$and.push({
                    id : query["_id"]
                });
                delete query["_id"];
            }
        }

        paramsSearch["_lastUpdated"] = (query) => {
            if (!_.isArray(query["_lastUpdated"])) {
                query["_lastUpdated"] = [query["_lastUpdated"]]
            }
            for (let i in query["_lastUpdated"]) {
                let buildResult = queryBuild.instantQuery(query["_lastUpdated"][i], "meta.lastUpdated");
                if (!buildResult) {
                    throw new Error(\`invalid date: \${query["_lastUpdated"]}\`);
                }
                query.$and.push(buildResult);
            }
            delete query["_lastUpdated"];
        }
        `

        let searchParameter = fs.readFileSync('./FHIRParametersClean.json', 'utf-8');
        searchParameter = JSON.parse(searchParameter);
        let resSearchParams = searchParameter[res];
        let mongodb = require('./models/mongodb');
        //console.log(res);
        let resJsonSchema = mongodb[res].jsonSchema();
        for (let key in resSearchParams) {
            let paramObj = resSearchParams[key];
            let param = paramObj["parameter"];
            let type = paramObj["type"];
            let field = paramObj["field"];
            try {
                let searchFuncTxt = genParamFunc[type](param, field, resJsonSchema);
                get += beautify(searchFuncTxt);
            } catch (e) {
                if (e.message.includes("not a function")) {
                    console.log(type);
                    console.error(e);
                }
            }
        }
        //#endregion

        //#region getById
        const getById = `
        const read = require('../../../FHIRApiService/read');
        
        module.exports = async function(req, res) {
            return await read(req , res , "${res}");
        };
        `
        //#endregion

        //#region getHistory
        const getHistory = `
        const history = require('../../../FHIRApiService/history');

        module.exports = async function(req , res) {
            return await history(req, res, "${res}");
        }
        `;
        //#endregion

        //#region getHistoryById
        const getHistoryById = `
        const vread = require('../../../FHIRApiService/vread');

        module.exports = async function(req, res) {
            return await vread(req ,res, "${res}");
        }
        `;
        //#endregion

        //#region create resource (post)
        const post = `
        const create = require('../../../FHIRApiService/create');
        module.exports = async function(req, res) {
            return await create(req , res , "${res}");
        }
        `
        //#endregion

        //#region update (put)
        const put = `
        const update = require('../../../FHIRApiService/update.js');

        module.exports = async function(req, res) {
            return await update(req, res, "${res}");
        }
        `
        //#endregion

        //#region delete
        const deleteJs = `
        const deleteAPI = require('../../../FHIRApiService/delete');

        module.exports = async function (req, res) {
            return await deleteAPI(req, res, "${res}");
        }
        `
        //#endregion

        const validationScript = `
        const validate = require('../../../FHIRApiService/$validate');

        module.exports = async function (req, res) {
            return await validate(req,res, "${res}");
        }
        `;
        
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}.js`, beautify(get));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}ById.js`, beautify(getById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}History.js`, beautify(getHistory));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}HistoryById.js`, beautify(getHistoryById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/post${res}.js`, beautify(post));
        fs.writeFileSync(`./api/FHIR/${res}/controller/put${res}.js`, beautify(put));
        fs.writeFileSync(`./api/FHIR/${res}/controller/delete${res}.js`, beautify(deleteJs));
        fs.writeFileSync(`./api/FHIR/${res}/controller/post${res}Validate.js`, beautify(validationScript));
        let indexJs = `
        const express = require('express');
        const router = express.Router();
        const joi = require('joi');
        const {
            FHIRValidateParams
        } = require('api/validator');
        const FHIR = require('../../../models/FHIR/fhir/fhir').Fhir;
        const { handleError } = require('../../../models/FHIR/httpMessage');
        const _ = require('lodash');
        const config = require('../../../config/config');
        const { user } = require('../../apiService');

        function setFormatWhenQuery (req , res) {
            let format = _.get(req , "query._format");
            if (format && format.includes("xml")) {
                res.set('Content-Type', 'application/fhir+xml');
            } else if (format && format.includes("json")) {
                res.set('Content-Type', 'application/fhir+json');
            }
            delete req['query']['_format'];
        }

        router.use((req, res, next) => {
            try {
                if (req.headers["content-type"]) {
                    if (req.headers["content-type"].includes("xml")) {
                        res.set('Content-Type', 'application/fhir+xml');
                        if (req.method == "POST") {
                            let Fhir = new FHIR();
                            req.body = Fhir.xmlToObj(req.body);
                        }
                    }
                }
                _.get(req.headers, "accept") ? "" : ( ()=> {
                    _.get(req.headers , "content-type") ? _.set(req.headers , "accept" , _.get(req.headers , "content-type")) : _.set(req.headers , "accept" , "application/fhir+json");
                })();
                if (req.headers.accept.includes("xml")) {
                    res.set('Content-Type', 'application/fhir+xml');
                } else {
                    res.set('Content-Type', 'application/fhir+json');
                }
                setFormatWhenQuery(req , res);
                next();
            } catch (e) {
                return res.send(handleError.exception(e));
            }
        });

        if (process.env.ENABLE_TOKEN_AUTH == "true") {
            router.use(user.tokenAuthentication);
        }

        if (_.get(config, "${res}.interaction.search", true)) {
            router.get('/', FHIRValidateParams({
                "_offset": joi.number().integer(),
                "_count": joi.number().integer()
            }, "query", {
                allowUnknown: true
            }), require('./controller/get${res}'));
        }
        
        if (_.get(config, "${res}.interaction.read",true)) {
            router.get('/:id', require('./controller/get${res}ById'));
        }
        
        if (_.get(config, "${res}.interaction.history", true)) {
            router.get('/:id/_history', FHIRValidateParams({
                "_offset": joi.number().integer(),
                "_count": joi.number().integer()
            }, "query", {
                allowUnknown: true
            }), require('./controller/get${res}History'));
        }
        
        if (_.get(config, "${res}.interaction.vread", true)) {
            router.get('/:id/_history/:version', require('./controller/get${res}HistoryById'));
        }

        if (_.get(config, "${res}.interaction.create", true)) {
            router.post('/', require('./controller/post${res}'));
        }

        //router.post('/([\\$])validate', require('./controller/post${res}Validate'));

        if (_.get(config, "${res}.interaction.update", true)) {
            router.put('/:id', require("./controller/put${res}"));
        }
        
        if (_.get(config, "${res}.interaction.delete", true)) {
            router.delete('/:id', require("./controller/delete${res}"));
        }

        module.exports = router;`
        fs.writeFileSync(`./api/FHIR/${res}/index.js`, beautify(indexJs));
    }
}
function getDirInFHIRAPI() {
    let dirInFHIRAPI = fs.readdirSync('./api/FHIR', { withFileTypes: true })
        .filter(itemInDir => itemInDir.isDirectory())
        .map(dirItem => {
            if (dirItem.name.toLocaleLowerCase() != "metadata") {
                return dirItem.name;
            }
        });
    dirInFHIRAPI = _.compact(dirInFHIRAPI);
    return dirInFHIRAPI;
}
function generateMetaData() {
    let dirInFHIRAPI = getDirInFHIRAPI();
    const fhirUrl = "http://hl7.org/fhir/R4";
    let metaData = {
        "rest": [
            {
                "mode": "server",
                "resource": []
            }
        ]
    };
    console.log(dirInFHIRAPI);
    for (let resource of dirInFHIRAPI) {
        metaData.rest[0].resource.push({
            "type": resource,
            "profile": `${fhirUrl}/${resource.toLocaleLowerCase()}.html`,
            "interaction": [
                {
                    "code": "read"
                },
                {
                    "code": "update"
                },
                {
                    "code": "delete"
                },
                {
                    'code': "create"
                }
            ],
            "versioning": "versioned",
            "updateCreate": true,
            "conditionalDelete": "single",
            "searchInclude": [],
            "searchRevInclude": [],
            "searchParam": [
                {
                    "name": "_id",
                    "type": "string"
                }
            ]
        });
    }
    mkdirp.sync("./api/FHIR/metadata");
    mkdirp.sync("./api/FHIR/metadata/controller");
    let metadataRouteIndexText = `
    const express = require('express');
    const router = express.Router();
    const {validateParams} = require('../../validator');
    const Joi = require('joi');
    const _ = require('lodash');

    router.use((req, res, next) => {
        res.set('Content-Type', 'application/fhir+json');
        next();
    });
    
    router.get('/' , require('./controller/getMetadata'));
    
    module.exports = router;`
    fs.writeFileSync("./api/FHIR/metadata/index.js", beautify(metadataRouteIndexText));
    let metadataText = `
    const uuid = require('uuid');
    const moment = require('moment');
    const _ = require('lodash');
    const fs = require('fs');
    
    const fhirUrl = "http://hl7.org/fhir/R4";

    module.exports = async function (req ,res) {
        const metaData = {
            "resourceType": "CapabilityStatement",
            "status": "active",
            "date": moment.utc().toDate(),
            "publisher": "Not provided",
            "kind": "instance",
            "software": {
            "name": "FHIR-Server Burni",
            "version": "1.0.0"
            },
            "implementation": {
            "description": "Burni FHIR R4 Server",
            "url": \`http://${process.env.FHIRSERVER_HOST}/${process.env.FHIRSERVER_APIPATH}\`
            },
            "fhirVersion": "4.0.1",
            "format": [ "json" ],
            "rest" : ${JSON.stringify(metaData.rest, null, 4)}
        }
        res.json(metaData);
    }
    `
    fs.writeFileSync("./api/FHIR/metadata/controller/getMetadata.js", beautify(metadataText));
}
/*generateAPI({
    resources : ["Patient" , "MedicationRequest" , "Observation" , "ImagingStudy" , "Claim"]
})*/
function generateConfig() {
    const interactions = ["read", "vread", "update", "delete", "history", "create","search"];
    let configJson = require("./config/config");
    let dirInFHIRAPI = getDirInFHIRAPI();
    for (let resource of dirInFHIRAPI) {
        for (let interaction of interactions) {
            if (!_.has(configJson, `${resource}.interaction.${interaction}`)) {
                _.set(configJson, `${resource}.interaction.${interaction}`, true);
            }
        }
    }
    fs.writeFileSync("./config/config.js", `module.exports=${JSON.stringify(configJson, null, 4)}`);
}

module.exports = {
    generateAPI: generateAPI,
    generateMetaData: generateMetaData,
    generateConfig: generateConfig
}






