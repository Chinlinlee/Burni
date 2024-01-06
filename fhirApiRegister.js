const path = require("path");
const fs = require("fs");
const joi = require("joi");

const { FhirEnv } = require("./env-class");
const jsBeautify = require("js-beautify");
const fastJson = require("fast-json-stringify");
const ajv = require("ajv");

let config;
let configFile = path.join(__dirname, "./config/config.js");
if (fs.existsSync(configFile)) {
    config = require("./config/config");
} else {
    config = require("./config/config.template");
}

const readApi = require("./api/FHIRApiService/read");
const instanceHistoryApi = require("./api/FHIRApiService/history");

class FhirApiRegisterHelper {
    constructor(app) {
        /** @type { import("fastify").FastifyInstance } */
        this.app = app;
    }

    async registerFhirApis() {
        this.app.decorateRequest("isPretty", false);

        for (let resourceType in config) {
            await this.registerModel(resourceType);

            if (config[resourceType]?.interaction?.search) {
                await this.registerSearchApi(resourceType);
            }

            if (config[resourceType]?.interaction.read) {
                await this.registerReadApi(resourceType);
            }

            if (config[resourceType]?.interaction.history) {
                await this.registerInstanceHistoryApi(resourceType);
            }
        }
    }

    /**
     * @private
     * @param {string} resourceType 
     */
    async registerSearchApi(resourceType) {
        this.app.get(`/${FhirEnv.apiPath}/${resourceType}`, {
            schema: {
                querystring: joi.object().keys({
                    "_offset": joi.number().integer(),
                    "_count": joi.number().integer(),
                    "_pretty": joi.boolean().default(true),
                    "_total": joi.string().allow("none", "estimate", "accurate").default("estimate")
                }).unknown(true)
            },
            validatorCompiler: ({ schema, method, url, httpPart }) => {
                return data => schema.validate(data);
            },
            onRequest: [
                ...FhirApiHandlerFactory.getOnRequest()
            ],
            preHandler: [...FhirApiHandlerFactory.getPreHandler()],
            onSend: [...FhirApiHandlerFactory.getOnSend()]
        }, async (request, reply) => {
            let { paramsSearch } = require(`./api/FHIR/${resourceType}/${resourceType}ParametersHandler.js`);
            let searchHandler = require("./api/FHIRApiService/search");
            return await searchHandler(request, reply, resourceType, paramsSearch);
        });
    }

    /**
     * @private
     * @param {string} resourceType 
     */
    async registerReadApi(resourceType) {
        this.app.get(`/${FhirEnv.apiPath}/${resourceType}/:id`, {
            onRequest: [
                ...FhirApiHandlerFactory.getOnRequest()
            ],
            preHandler: [...FhirApiHandlerFactory.getPreHandler()],
            onSend: [...FhirApiHandlerFactory.getOnSend()]
        }, (request, reply) => {
            return readApi(request, reply, resourceType);
        });
    }

    async registerInstanceHistoryApi(resourceType) {
        this.app.get(`/${FhirEnv.apiPath}/${resourceType}/:id/_history`, {
            schema: {
                querystring: joi.object().keys({
                    "_offset": joi.number().integer(),
                    "_count": joi.number().integer(),
                    "_pretty": joi.boolean().default(true)
                }).unknown(true)
            },
            validatorCompiler: ({ schema, method, url, httpPart }) => {
                return data => schema.validate(data);
            },
            onRequest: [
                ...FhirApiHandlerFactory.getOnRequest()
            ],
            preHandler: [...FhirApiHandlerFactory.getPreHandler()],
            onSend: [...FhirApiHandlerFactory.getOnSend()]
        }, (request, reply) => {
            return instanceHistoryApi(request, reply, resourceType);
        });
    }

    async registerModel(resourceType) {
        require(`./models/mongodb/model/${resourceType}`)();
        require(`./models/mongodb/model/${resourceType}_history`)();
    }
}

class FhirApiHandlerFactory {
    constructor() {
    }

    static getOnRequest() {
        return [
            FhirApiHandlerFactory.setContentTypeBeforeRequest,
            FhirApiHandlerFactory.setContentTypeFromQuery
        ];
    }

    static getPreHandler() {
        return [
            // set isPretty for request
            async (request, reply) => {
                request.isPretty = request.query?._pretty;
            }
        ];
    }

    static getOnSend() {
        return [
            FhirApiHandlerFactory.doPrettyJson
        ];
    }

    static async doPrettyJson(request, reply, payload) {
        const beautifyOption = { indent_size: 4, space_in_empty_paren: true };
        if (request.isPretty)
            return jsBeautify(payload, beautifyOption);
        return payload;
    }

    /**
     * 
     * @param {import("fastify").FastifyRequest} request 
     * @param {import("fastify").FastifyReply} reply 
     */
    static async setContentTypeBeforeRequest(request, reply) {
        reply.type("application/fhir+json");

        if (request.headers?.["content-type"] &&
            request.headers?.["content-type"].includes("xml")) {
            reply.type("application/fhir+xml");
        }

        const xmlAcceptList = [
            "application/xml",
            "application/fhir+xml",
            "xml"
        ];

        for (let i = 0; i < xmlAcceptList.length; i++) {
            let xmlAccept = xmlAcceptList[i];
            if (request.headers?.accept?.includes(xmlAccept)) {
                reply.type("application/fhir+xml");
            } else {
                reply.type("application/fhir+json");
            }
        }
    }

    /**
     * 
     * @param {import("fastify").FastifyRequest} request 
     * @param {import("fastify").FastifyReply} reply 
     */
    static async setContentTypeFromQuery(request, reply) {
        if (request.query?._format) {
            if (request.query?._format.includes("xml")) {
                reply.type("application/fhir+xml");
            } else {
                reply.type("application/fhir+json");
            }
        }
        delete request["query"]["_format"];
    }
}

module.exports.FhirApiRegisterHelper = FhirApiRegisterHelper;