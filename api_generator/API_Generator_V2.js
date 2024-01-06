const fhirgen = require("../FHIR-mongoose-Models-Generator/resourceGenerator");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const beautify = require("js-beautify").js;
const _ = require("lodash");
require("dotenv").config();
const { genParamFunc } = require("./searchParametersCodeGenerator");

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
        mkdirp.sync(`./api/FHIR/${res}`);

        //#region search parameters
        let resourceParameterHandler = `
        const _ = require('lodash');
        const queryBuild = require('../../../models/FHIR/queryBuild.js');
        const queryHandler = require('../../../models/FHIR/searchParameterQueryHandler');
        const jp = require("jsonpath");
        let resourceInclude = require("../../../api_generator/resource-reference/resourceInclude.json");
        const { chainSearch } = require('../../../models/FHIR/queryBuild.js');
        const path = require("path");

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
        let searchParameter = require("./FHIRParametersClean.json");
        let resSearchParams = searchParameter[res];
        let resourceDefinition = require(
            `./to-code-use-definition/${res}.json`
        );
        for (let key in resSearchParams) {
            let paramObj = resSearchParams[key];
            let param = paramObj["parameter"];
            let type = paramObj["type"];
            let field = paramObj["field"];
            try {
                let searchFuncTxt = genParamFunc[type](
                    param,
                    field,
                    resourceDefinition
                );
                resourceParameterHandler += searchFuncTxt;
            } catch (e) {
                if (e.message.includes("not a function")) {
                    console.error(
                        `The parameter type "${type}" is not support`
                    );
                } else {
                    console.error(e);
                }
            }
        }
        resourceParameterHandler += `
        module.exports.paramsSearch = paramsSearch;
        module.exports.paramsSearchFields = paramsSearchFields;
        `;
        //#endregion

        fs.writeFileSync(
            `./api/FHIR/${res}/${res}ParametersHandler.js`,
            beautify(resourceParameterHandler)
        );
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
    const _ = require('lodash');
    const moment = require("moment");
    const { FhirEnv } = require("@root/env-class.js");
    const { FhirApiHandlerFactory } = require("@root/fhirApiRegister.js");
    
    const fhirUrl = "http://hl7.org/fhir/R4";

    /**
     * 
     * 
     * @param {import("fastify").FastifyInstance} app 
     * @param {any} options 
     */
    module.exports = async function(app, options) {
        app.get(\`/\${FhirEnv.apiPath}/metadata\`, {
            onRequest: [
                async (request, reply) => {
                    reply.type("application/fhir+json");
                }
            ]
        }, async (request, reply) => {
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
            return reply.send(metaData);
        });
    };`;
    fs.writeFileSync(
        path.join(__dirname, "../fastify-modules/metadata.js"),
        beautify(metadataRouteIndexText)
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
    generateConfig: generateConfig
};
