const fhirgen = require('../FHIR-mongoose-Models-Generator/resourceGenerator');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const beautify = require('js-beautify').js;
const _ = require('lodash');
require('dotenv').config();
const { genParamFunc } = require('./searchParametersCodeGenerator');
const GENERATE_API_DOC = true;

/**
 * @param {string} resource resource type
 */
function getCodeGetById(resource) {
    const responseExampleBody = require(`../docs/assets/FHIR/burni-create-examples-response/${resource}.json`);
    const responseXMLExampleBody = fs.readFileSync(path.join(__dirname, `../docs/assets/FHIR/burni-create-examples-response-xml/${resource}.xml`), { encoding: 'utf8'});
    const comment = `
    /**
     * 
     * @api {get} /fhir/${resource}/:id read ${resource}
     * @apiParam {string} id Resource ID in server
     * @apiName read${resource}
     * @apiGroup ${resource}
     * @apiVersion  v2.1.0
     * @apiDescription read ${resource} resource by id.
     * 
     * @apiExample {Shell} cURL
     * #example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
     * curl --location --request GET 'http://burni.example.com/fhir/${resource}/${responseExampleBody.id}'
     * @apiExample {JavaScript} javascript Axios
     //example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
    const axios = require('axios');
    const config = {
        method: 'get',
        url: 'http://burni.example.com/fhir/${resource}/${responseExampleBody.id}'
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
    * @apiSuccess (Success 200 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiSuccessExample {json} (200) name: Success-Response Content-Type: application/fhir+json
    ${JSON.stringify(responseExampleBody, null, 4)}
    * 
    * @apiSuccess (Success 200 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE
    * @apiSuccessExample {xml} (200) name: Success-Response-XML Content-Type: application/fhir+xml
    ${responseXMLExampleBody}
    *
    * @apiError (Error Not Found 404 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiErrorExample {json} (404) name: Not-Found-Response Content-Type: application/fhir+json
    {
        "resourceType": "OperationOutcome",
        "issue": [
            {
                "severity": "error",
                "code": "exception",
                "diagnostics": "not found ${resource}/${responseExampleBody.id}"
            }
        ]
    }
    *
    * @apiError (Error Not Found 404 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE
    * @apiErrorExample {xml} (404) name: Not-Found-Response-XML Content-Type: application/fhir+xml
    <OperationOutcome xmlns='http://hl7.org/fhir'>
    <issue>
        <severity value='error'/>
        <code value='exception'/>
        <diagnostics value='not found ${resource}/${responseExampleBody.id}'/>
    </issue>
    </OperationOutcome>
    *
    */
    `;
    const getById = `
    const read = require('../../../FHIRApiService/read');
    
    module.exports = async function(req, res) {
        return await read(req , res , "${resource}");
    };
    `;
    if (GENERATE_API_DOC) return `${comment}${getById}`;
    return `${getById}`;
}

function getCodeCreate(resource) {
    const responseExampleBody = require(`../docs/assets/FHIR/burni-create-examples-response/${resource}.json`);
    const responseXMLExampleBody = fs.readFileSync(path.join(__dirname,`../docs/assets/FHIR/burni-create-examples-response-xml/${resource}.xml`), { encoding: 'utf8'});
    const comment = `
    /**
     * 
     * @api {post} /fhir/${resource} create ${resource}
     * @apiName create${resource}
     * @apiGroup ${resource}
     * @apiVersion  v2.1.0
     * @apiDescription create ${resource} resource.
     * 
     * @apiParam {string=${resource}} resourceType 
     * @apiParamExample {json} name: json-example Content-Type: application/fhir+json
     * 
     ${JSON.stringify(responseExampleBody, null, 4)}
     *
     * @apiParamExample {xml} name: xml-example Content-Type: application/fhir+xml
     * 
     ${responseXMLExampleBody}
     *
     * @apiExample {Shell} cURL
     * #example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
     * curl --location --request POST 'http://burni.example.com/fhir/${resource} \\' 
     * --header 'Content-Type: application/fhir+json' \\
     * --data-raw '${JSON.stringify(responseExampleBody)}'
     * @apiExample {JavaScript} javascript Axios
     //example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
    const axios = require('axios');
    const data = ${JSON.stringify(responseExampleBody)}
    const config = {
        method: 'post',
        url: 'http://burni.example.com/fhir/${resource}',
        headers: { 
            'Content-Type': 'application/fhir+json'
        },
        data: data
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
    * @apiSuccess (Success 200 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiSuccessExample {json} (200) name: json-example Content-Type: application/fhir+json
    ${JSON.stringify(responseExampleBody, null, 4)}
    *
    * @apiSuccess (Success 200 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE 
    * @apiSuccessExample {xml} (200) name: xml-example Content-Type: application/fhir+xml
    ${responseXMLExampleBody}
    *
    * @apiError (Error Not Found 400 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiErrorExample {json} (400) name: Bad-Request-Response Content-Type: application/fhir+json
    {
        "resourceType": "OperationOutcome",
        "issue": [
            {
                "severity": "error",
                "code": "exception",
                "diagnostics": "validation error, path \`resourceType\` is required"
            }
        ]
    }
    * @apiError (Error Not Found 400 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE
    * @apiErrorExample {xml} (400) name: Bad-Request-Response Content-Type: application/fhir+xml
    * 
    <OperationOutcome xmlns='http://hl7.org/fhir'>
    <issue>
        <severity value='error'/>
        <code value='exception'/>
        <diagnostics value='validation error, path \`resourceType\` is required'/>
    </issue>
    </OperationOutcome>
    * 
    */
    `;
    let post = `
    const create = require('../../../FHIRApiService/create');
    module.exports = async function(req, res) {
        return await create(req , res , "${resource}");
    };
    `;
    if (resource == "List") {
        post = `
        const create = require('../../../FHIRApiService/create');
        const _ = require('lodash');
        module.exports = async function(req, res) {
            let resourceData = req.body;
            if (_.isArray(resourceData.entry) && resourceData.entry.length > 0) {
                for (let index in resourceData.entry) {
                    let entry = resourceData.entry[index];
                    if (resourceData.mode != "changes") {
                        delete entry.delete;
                    } else if (resourceData.mode != "working") {
                        delete entry.date;
                    }
                }
            }
            return await create(req , res , "${resource}");
        };
        `;
    }
    if (GENERATE_API_DOC) return `${comment}${post}`;
    return `${post}`;
}

function getCodeUpdate(resource) {
    const requestExampleBody = require(`../docs/assets/FHIR/fhir-resource-examples-random-modify/${resource.toLowerCase()}-example.json`);
    const responseExampleBody = require(`../docs/assets/FHIR/burni-update-examples-response/${resource}.json`);
    const requestXMLExampleBody = fs.readFileSync(path.join(__dirname, `../docs/assets/FHIR/fhir-resource-examples-random-modify-xml/${resource.toLowerCase()}-example.xml`), { encoding: 'utf8'});
    const responseXMLExampleBody = fs.readFileSync(path.join(__dirname, `../docs/assets/FHIR/burni-update-examples-response-xml/${resource}.xml`), { encoding: 'utf8'});
    const comment = `
    /**
     * 
     * @api {put} /fhir/${resource}/:id update ${resource}
     * @apiName update${resource}
     * @apiGroup ${resource}
     * @apiVersion  v2.1.0
     * @apiDescription update ${resource} resource.
     * 
     * @apiParam {string=${resource}} resourceType 
     * @apiParamExample {json} name: json-example Content-Type: application/fhir+json
     * 
     ${JSON.stringify(requestExampleBody, null, 4)}
     *
     * @apiParamExample {xml} name: xml-example Content-Type: application/fhir+xml
     * 
     ${requestXMLExampleBody}
     *
     * @apiExample {Shell} cURL
     * #example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
     * curl --location --request PUT 'http://burni.example.com/fhir/${resource}/${resource}-example \\' 
     * --header 'Content-Type: application/fhir+json' \\
     * --data-raw '${JSON.stringify(requestExampleBody)}'
     * @apiExample {JavaScript} javascript Axios
     //example from: https://chinlinlee.github.io/Burni/assets/FHIR/fhir-resource-examples/${resource.toLowerCase()}-example.json
    const axios = require('axios');
    const data = ${JSON.stringify(responseExampleBody)}
    const config = {
        method: 'put',
        url: 'http://burni.example.com/fhir/${resource}/${resource}-example',
        headers: { 
            'Content-Type': 'application/fhir+json'
        },
        data: data
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
    * @apiSuccess (Success 200 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiSuccessExample {json} (200) name: json-example Content-Type: application/fhir+json
    ${JSON.stringify(responseExampleBody, null, 4)}
    *
    * @apiSuccess (Success 200 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE 
    * @apiSuccessExample {xml} (200) name: xml-example Content-Type: application/fhir+xml
    ${responseXMLExampleBody}
    *
    * @apiError (Error Not Found 400 Content-Type: application/fhir+json) {object} FHIR-JSON-RESOURCE
    * @apiErrorExample {json} (400) name: Bad-Request-Response Content-Type: application/fhir+json
    {
        "resourceType": "OperationOutcome",
        "issue": [
            {
                "severity": "error",
                "code": "exception",
                "diagnostics": "validation error, path \`resourceType\` is required"
            }
        ]
    }
    * @apiError (Error Not Found 400 Content-Type: application/fhir+xml) {object} FHIR-XML-RESOURCE
    * @apiErrorExample {xml} (400) name: Bad-Request-Response Content-Type: application/fhir+xml
    * 
    <OperationOutcome xmlns='http://hl7.org/fhir'>
    <issue>
        <severity value='error'/>
        <code value='exception'/>
        <diagnostics value='validation error, path \`resourceType\` is required'/>
    </issue>
    </OperationOutcome>
    * 
    */
    `;
    let put = `
    const update = require('../../../FHIRApiService/update.js');

    module.exports = async function(req, res) {
        return await update(req, res, "${resource}");
    };
    `;
    if (GENERATE_API_DOC) return `${comment}${put}`;
    return `${put}`;
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
        const search = require('../../../FHIRApiService/search');
        const { paramsSearch } = require('../${res}ParametersHandler');
        module.exports = async function(req, res) {
            return await search(req, res,"${res}", paramsSearch);
        };
        `;
        //#endregion

        //#region search parameters
        let resourceParameterHandler = `
        const _ = require('lodash');
        const queryBuild = require('../../../models/FHIR/queryBuild.js');
        const queryHandler = require('../../../models/FHIR/searchParameterQueryHandler');

        let paramsSearchFields = {};

        const paramsSearch = {
            "_id" : (query) => {
                query.$and.push({
                    id : query["_id"]
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
                    throw new Error(\`invalid date: \${query["_lastUpdated"]}\`);
                }
                query.$and.push(buildResult);
            }
            delete query["_lastUpdated"];
        };
        `;
        let searchParameter = require('./FHIRParametersClean.json');
        let resSearchParams = searchParameter[res];
        let resourceDefinition = require(`./to-code-use-definition/${res}.json`);
        for (let key in resSearchParams) {
            let paramObj = resSearchParams[key];
            let param = paramObj["parameter"];
            let type = paramObj["type"];
            let field = paramObj["field"];
            try {
                let searchFuncTxt = genParamFunc[type](param, field, resourceDefinition);
                resourceParameterHandler += (searchFuncTxt);
            } catch (e) {
                if (e.message.includes("not a function")) {
                    console.log(type);
                    console.error(e);
                }
            }
        }
        resourceParameterHandler += `
        module.exports.paramsSearch = paramsSearch;
        `;
        //#endregion

        //#region getById
        const getById = getCodeGetById(res);
        //#endregion

        //#region getHistory
        const getHistory = `
        const history = require('../../../FHIRApiService/history');

        module.exports = async function(req , res) {
            return await history(req, res, "${res}");
        };
        `;
        //#endregion

        //#region getHistoryById
        const getHistoryById = `
        const vread = require('../../../FHIRApiService/vread');

        module.exports = async function(req, res) {
            return await vread(req ,res, "${res}");
        };
        `;
        //#endregion

        //#region create resource (post)
        let post = getCodeCreate(res);
        //#endregion

        //#region update (put)
        let put = getCodeUpdate(res);
        if (res == "List") {
            put = `
            const update = require('../../../FHIRApiService/update.js');
            const _ = require('lodash');
            module.exports = async function(req, res) {
                let resourceData = req.body;
                if (_.isArray(resourceData.entry) && resourceData.entry.length > 0) {
                    for (let index in resourceData.entry) {
                        let entry = resourceData.entry[index];
                        if (resourceData.mode != "changes") {
                            delete entry.delete;
                        } else if (resourceData.mode != "working") {
                            delete entry.date;
                        }
                    }
                }
                return await update(req, res, "${res}");
            };
            `;
        }
        //#endregion

        //#region delete
        const deleteJs = `
        const deleteAPI = require('../../../FHIRApiService/delete');

        module.exports = async function (req, res) {
            return await deleteAPI(req, res, "${res}");
        };
        `;
        //#endregion

        //#region condition delete  
        const conditionDeleteJs = `
        const conditionDelete = require('../../../FHIRApiService/condition-delete');
        const {
            paramsSearch
        } = require('../${res}ParametersHandler');
        module.exports = async function(req, res) {
            return await conditionDelete(req, res, "${res}", paramsSearch);
        };
        `;
        //#endregion

        const validationScript = `
        const validate = require('../../../FHIRApiService/$validate');

        module.exports = async function (req, res) {
            return await validate(req,res, "${res}");
        };
        `;
        
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}.js`, beautify(get));
        fs.writeFileSync(`./api/FHIR/${res}/${res}ParametersHandler.js`, beautify(resourceParameterHandler));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}ById.js`, beautify(getById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}History.js`, beautify(getHistory));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}HistoryById.js`, beautify(getHistoryById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/post${res}.js`, beautify(post));
        fs.writeFileSync(`./api/FHIR/${res}/controller/put${res}.js`, beautify(put));
        fs.writeFileSync(`./api/FHIR/${res}/controller/delete${res}.js`, beautify(deleteJs));
        fs.writeFileSync(`./api/FHIR/${res}/controller/condition-delete${res}.js`, beautify(conditionDeleteJs));
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
                        if (req.method == "POST" || req.method == "PUT") {
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
            router.delete('/', require("./controller/condition-delete${res}"));
        }

        module.exports = router;`;
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
    
    module.exports = router;`;
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
    `;
    fs.writeFileSync("./api/FHIR/metadata/controller/getMetadata.js", beautify(metadataText));
}
/*generateAPI({
    resources : ["Patient" , "MedicationRequest" , "Observation" , "ImagingStudy" , "Claim"]
})*/
function generateConfig() {
    const interactions = ["read", "vread", "update", "delete", "history", "create","search"];
    let configJson = require("../config/config");
    let dirInFHIRAPI = getDirInFHIRAPI();
    for (let resource of dirInFHIRAPI) {
        for (let interaction of interactions) {
            if (!_.has(configJson, `${resource}.interaction.${interaction}`)) {
                _.set(configJson, `${resource}.interaction.${interaction}`, true);
            }
        }
    }
    fs.writeFileSync("./config/config.js", `module.exports=${JSON.stringify(configJson, null, 4)};`);
}

module.exports = {
    generateAPI: generateAPI,
    generateMetaData: generateMetaData,
    generateConfig: generateConfig
};






