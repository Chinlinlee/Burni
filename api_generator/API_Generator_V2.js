const fhirgen = require("../FHIR-mongoose-Models-Generator/resourceGenerator");
const fs = require("fs");
const mkdirp = require("mkdirp");
const beautify = require("js-beautify").js;
const _ = require("lodash");
require("dotenv").config();

/**
 * @param {string} resource resource type
 */
function getCodeGetById(resource) {
    const getById = `
    const read = require('../../../FHIRApiService/read');
    
    module.exports = async function(req, res) {
        return await read(req , res , "${resource}");
    };
    `;
    return `${getById}`;
}

function getCodeCreate(resource) {
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
    return `${post}`;
}

function getCodeUpdate(resource) {
    let put = `
    const update = require('../../../FHIRApiService/update.js');

    module.exports = async function(req, res) {
        return await update(req, res, "${resource}");
    };
    `;
    return `${put}`;
}

/**
 * @param {string} resource
 * @returns {Record<string, string>} files relative to `api/FHIR/${resource}/`
 */
function getGeneratedApiFiles(resource) {
    const get = `
        const search = require('../../../FHIRApiService/search');
        const { paramsSearch } = require('../${resource}ParametersHandler');
        module.exports = async function(req, res) {
            return await search(req, res,"${resource}", paramsSearch);
        };
        `;

    const getById = getCodeGetById(resource);

    const getHistory = `
        const history = require('../../../FHIRApiService/history');

        module.exports = async function(req , res) {
            return await history(req, res, "${resource}");
        };
        `;

    const getHistoryById = `
        const vread = require('../../../FHIRApiService/vread');

        module.exports = async function(req, res) {
            return await vread(req ,res, "${resource}");
        };
        `;

    const post = getCodeCreate(resource);

    let put = getCodeUpdate(resource);
    if (resource == "List") {
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
                return await update(req, res, "${resource}");
            };
            `;
    }

    const deleteJs = `
        const deleteAPI = require('../../../FHIRApiService/delete');

        module.exports = async function (req, res) {
            return await deleteAPI(req, res, "${resource}");
        };
        `;

    const conditionDeleteJs = `
        const conditionDelete = require('../../../FHIRApiService/condition-delete');
        const {
            paramsSearch
        } = require('../${resource}ParametersHandler');
        module.exports = async function(req, res) {
            return await conditionDelete(req, res, "${resource}", paramsSearch);
        };
        `;

    const validationScript = `
        const validate = require('../../../FHIRApiService/$validate');

        module.exports = async function (req, res) {
            return await validate(req,res, "${resource}");
        };
        `;

    const indexJs = `
        const express = require('express');
        const router = express.Router();
        const joi = require('joi');
        const {
            FHIRValidateParams
        } = require('api/validator');
        const _ = require('lodash');
        const config = require('../../../config/config');

        if (_.get(config, "${resource}.interaction.search", true)) {
            router.get('/', FHIRValidateParams({
                "_offset": joi.number().integer(),
                "_count": joi.number().integer(),
                "_pretty": joi.boolean().default(true),
                "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
            }, "query", {
                allowUnknown: true
            }), require('./controller/get${resource}'));
        }
        
        if (_.get(config, "${resource}.interaction.read",true)) {
            router.get('/:id', require('./controller/get${resource}ById'));
        }
        
        if (_.get(config, "${resource}.interaction.history", true)) {
            router.get('/:id/_history', FHIRValidateParams({
                "_offset": joi.number().integer(),
                "_count": joi.number().integer()
            }, "query", {
                allowUnknown: true
            }), require('./controller/get${resource}History'));
        }
        
        if (_.get(config, "${resource}.interaction.vread", true)) {
            router.get('/:id/_history/:version', require('./controller/get${resource}HistoryById'));
        }

        if (_.get(config, "${resource}.interaction.create", true)) {
            router.post('/', require('./controller/post${resource}'));
        }

        router.post('/([\\$])validate', require('./controller/post${resource}Validate'));

        if (_.get(config, "${resource}.interaction.update", true)) {
            router.put('/:id', require("./controller/put${resource}"));
        }
        
        if (_.get(config, "${resource}.interaction.delete", true)) {
            router.delete('/:id', require("./controller/delete${resource}"));
            router.delete('/', require("./controller/condition-delete${resource}"));
        }

        module.exports = router;`;

    return {
        [`controller/get${resource}.js`]: get,
        [`controller/get${resource}ById.js`]: getById,
        [`controller/get${resource}History.js`]: getHistory,
        [`controller/get${resource}HistoryById.js`]: getHistoryById,
        [`controller/post${resource}.js`]: post,
        [`controller/put${resource}.js`]: put,
        [`controller/delete${resource}.js`]: deleteJs,
        [`controller/condition-delete${resource}.js`]: conditionDeleteJs,
        [`controller/post${resource}Validate.js`]: validationScript,
        "index.js": indexJs
    };
}

/**
 *
 * @param {Object} option
 * @param {Array} option.resources the resources want to use
 * @param {Boolean} option.generateAllResources
 */
function generateAPI(option) {
    for (let res in option) {
        fhirgen(res, {
            resourcePath: "./models/mongodb/model",
            typePath: "./models/mongodb/FHIRTypeSchema"
        });
    }

    for (let res in option) {
        mkdirp.sync(`./api/FHIR/${res}/controller`);
        const files = getGeneratedApiFiles(res);
        for (const [relativePath, content] of Object.entries(files)) {
            fs.writeFileSync(
                `./api/FHIR/${res}/${relativePath}`,
                beautify(content)
            );
        }
    }
}
function getDirInFHIRAPI() {
    let dirInFHIRAPI = fs
        .readdirSync("./api/FHIR", { withFileTypes: true })
        .filter((itemInDir) => itemInDir.isDirectory())
        .map((dirItem) => {
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
        rest: [
            {
                mode: "server",
                resource: []
            }
        ]
    };

    for (let resource of dirInFHIRAPI) {
        metaData.rest[0].resource.push({
            type: resource,
            profile: `${fhirUrl}/${resource.toLocaleLowerCase()}.html`,
            interaction: getInteractionForResource(resource),
            versioning: "versioned",
            updateCreate: true,
            conditionalDelete: "single",
            searchInclude: [],
            searchRevInclude: [],
            searchParam: [
                {
                    name: "_id",
                    type: "string"
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
    fs.writeFileSync(
        "./api/FHIR/metadata/index.js",
        beautify(metadataRouteIndexText)
    );
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
            "url": \`http://${process.env.FHIRSERVER_HOST}/${
                process.env.FHIRSERVER_APIPATH
            }\`
            },
            "fhirVersion": "4.0.1",
            "format": [ "json" ],
            "rest" : ${JSON.stringify(metaData.rest, null, 4)}
        };
        res.json(metaData);
    };
    `;
    fs.writeFileSync(
        "./api/FHIR/metadata/controller/getMetadata.js",
        beautify(metadataText)
    );
}

function getInteractionForResource(resourceType) {
    let resourceConfig = require("../config/config");
    let interactionConfig = _.get(
        resourceConfig,
        `${resourceType}.interaction`
    );
    let interaction = [];
    let mapping = {
        read: "read",
        vread: "vread",
        update: "update",
        delete: "delete",
        history: "history-instance",
        create: "create",
        search: "search-type"
    };
    if (interaction) {
        for (let interactionName in interactionConfig) {
            interaction.push({
                code: mapping[interactionName]
            });
        }
        return interaction;
    } else {
        return [
            {
                code: "read"
            },
            {
                code: "update"
            },
            {
                code: "delete"
            },
            {
                code: "create"
            },
            {
                code: "vread"
            }
        ];
    }
}
/*generateAPI({
    resources : ["Patient" , "MedicationRequest" , "Observation" , "ImagingStudy" , "Claim"]
})*/
function generateConfig() {
    const interactions = [
        "read",
        "vread",
        "update",
        "delete",
        "history",
        "create",
        "search"
    ];
    let configJson = require("../config/config");
    let dirInFHIRAPI = getDirInFHIRAPI();
    for (let resource of dirInFHIRAPI) {
        for (let interaction of interactions) {
            if (!_.has(configJson, `${resource}.interaction.${interaction}`)) {
                _.set(
                    configJson,
                    `${resource}.interaction.${interaction}`,
                    true
                );
            }
        }
    }
    fs.writeFileSync(
        "./config/config.js",
        `module.exports=${JSON.stringify(configJson, null, 4)};`
    );
}

module.exports = {
    generateAPI: generateAPI,
    generateMetaData: generateMetaData,
    generateConfig: generateConfig,
    getGeneratedApiFiles: getGeneratedApiFiles
};
