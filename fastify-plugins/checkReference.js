const path = require("path");
const fs = require("fs");

const fp = require("fastify-plugin");
const { FhirEnv } = require("@root/env-class");

let pluginsConfigFile = path.join(__dirname, "./config.js");
let pluginsConfig;

if (fs.existsSync(pluginsConfigFile)) {
    pluginsConfig = require(pluginsConfigFile).pluginsConfig;
} else {
    pluginsConfig = require(
        path.join(__dirname, "./config.template.js")
    ).pluginsConfig;
}

const _ = require("lodash");
const { logger } = require("@root/utils/log");
const { doRes } = require("@root/utils/response");
const { handleError } = require("@models/FHIR/httpMessage");
const { FhirReferenceChecker } = require("@root/utils/fhir-ref-checker");


/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns
 */
async function checkReferenceMiddleware(req, res) {
    let resourceType = _.get(req.body, "resourceType");
    let resourceData = _.cloneDeep(req.body);
    let fhirReferenceChecker = new FhirReferenceChecker(resourceData);
    let checkReferenceRes = await fhirReferenceChecker.checkReference();
    if (!checkReferenceRes.status) {
        let notExistReferenceList = fhirReferenceChecker.getNotExistReferenceList(checkReferenceRes);
        let operationOutcomeError = handleError.processing(
            `The reference not found : ${_.map(
                notExistReferenceList,
                "value"
            ).join(",")}`
        );
        _.set(
            operationOutcomeError,
            "issue.0.location",
            _.map(notExistReferenceList, "path")
        );
        logger.error(
            `[Error: ${JSON.stringify(
                operationOutcomeError
            )}] [Resource Type: ${resourceType}]`
        );
        return doRes(req, res, 400, operationOutcomeError);
    }
}


/**
 * 
 * @param {import("fastify").FastifyInstance} app 
 * @param {*} options 
 */
async function checkReference(app, options) {
    let hookName = pluginsConfig.checkReference?.before ? "preHandler": "onResponse";
    app.addHook(hookName, async (request, reply) => {
        if (request.url?.startsWith(`/${FhirEnv.apiPath}`)
        ) {
            if (request.method === "POST" || request.method === "PUT") {
                await checkReferenceMiddleware(request, reply);
            }
        }
    });
}

let exportFn = async (app, options) => {};

if (pluginsConfig?.checkReference?.enable) {
    exportFn = checkReference;
}

module.exports = fp(exportFn, {
    name: "checkReference"
});