const _ = require("lodash");
const mongoose = require("mongoose");
const jsonPath = require("jsonpath");

const {
    getDeleteMessage,
    handleError,
    FhirWebServiceError,
    FhirValidationError
} = require("@models/FHIR/httpMessage");
const { BaseFhirApiService } = require("./base.service");
const { logger } = require("@root/utils/log");
const { CreateService } = require("./create.service");
const { UpdateService } = require("./update.service");
const { DeleteService } = require("./delete.service");
const { getUrlMatch, getResourceTypeInUrl, getIdInFullUrl } = require("@root/utils/fhir-param");
const { urlJoin } = require("@root/utils/url");
const uuid = require("uuid");
const resourceList = require("@models/FHIR/fhir.resourceList.json");
const { ReadService } = require("./read.service");

class BundleOpService extends BaseFhirApiService {
    constructor(req, res) {
        super(req, res, "Bundle");
        this.resourcesInEntry = this.getResourcesInEntry();
        this.bundleEntry = _.get(this.request.body, "entry");
        this.checkBaseBundle();
        this.checkFullUrl();
        this.bundleResponse = [];
        try {
            this.sortedEntry = this.getSortedEntry();
        } catch (e) {
            throw new FhirWebServiceError(400, e.message, handleError.processing);
        }
    }

    checkBaseBundle() {
        if (this.bundleEntry.length === 0) {
            throw new FhirWebServiceError(400, "Empty Bundle", handleError.processing);
        } else if (this.request.body.type !== "transaction" && this.request.body.type !== "batch") {
            throw new FhirWebServiceError(400, "Unsupported Operation", handleError.processing);
        }
    }

    checkFullUrl() {
        for (let entry of this.bundleEntry) {
            let fullUrl = _.get(entry, "fullUrl", "");
            if (!fullUrl) continue;

            let fullUrlSplit = _.compact(fullUrl.split("/"));
            if (!fullUrl.length === 2 ||
                !resourceList.includes(fullUrlSplit[0])
            ) {

                if (!/urn:oid:[0-2](\.[1-9]\d*)+/i.test(fullUrl) &&
                    !uuid.validate(fullUrl.replace(/^urn:uuid:/, ""))
                ) {
                    throw new FhirWebServiceError(400, `Invalid fullUrl ${fullUrl}, only support {resourceType}/{id} now`, handleError.processing);
                }

            }
        }
    }

    async doOp() {
        if (_.get(this.request.body, "type", "") === "transaction") {
            logger.info(`[Info: do bundle transaction] resource: ${JSON.stringify(this.request.body)}`);
            return await this.doTransaction();
        } else if (_.get(this.request.body, "type", "") === "batch") {
            logger.info(`[Info: do batch] resource: ${JSON.stringify(this.request.body)}`);
            return await this.doBatch();
        }
    }

    async doTransaction() {
        let transactionResponse;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (let item of this.sortedEntry) {
                let request = _.get(item, "request");
                let method = _.get(request, "method");
                let fullUrl = _.get(item, "fullUrl");
                let resourceType = _.get(item, "resource.resourceType") || getResourceTypeInUrl(request.url);
    
                if (method === "POST") {
                    logger.info("[Info: transaction create] resource: " + JSON.stringify(item));
                    let createHandler = new TransactionCreateHandler(resourceType, item.resource, fullUrl, this.sortedEntry, session, this);
                    await createHandler.create();
                } else if (method === "PUT") {
                    logger.info("[Info: transaction update] resource: " + JSON.stringify(item));
                    let updateHandler = new TransactionUpdateHandler(resourceType, item.resource, fullUrl, this.sortedEntry, session, this);
                    await updateHandler.update();
                   
                } else if (method === "DELETE") {
                    logger.info("[Info: transaction delete] resource: " + this.getIdInUrl(request.url));
                    let deleteResult = await this.delete(resourceType, this.getIdInUrl(request.url));
                    if (_.isString(deleteResult.result) && deleteResult.result.includes("not found")) {
                        this.bundleResponse.push({
                            status: "404 NOT FOUND"
                        });
                    } else {
                        this.bundleResponse.push({
                            status: "200 DELETE"
                        });
                    }
    
                } else if (method === "GET") {
                    let searchHandler = new TransactionSearchHandler(request, session, this);
                    let { code, result } = await searchHandler.search();
                    let response = {
                        status: code.toString()
                    };
    
                    if (result.resourceType === "OperationOutcome") {
                        _.set(response, "outcome", result);
                    } else {
                        _.set(response, "resource", result);
                    }
    
                    this.bundleResponse.push(response);
                } else {
                    await session.abortTransaction();
                    throw new FhirWebServiceError(400, "Unknown method, only support GET, POST, PUT and DELETE", handleError.processing);
                }
            }
        } catch(e) {
            await session.abortTransaction();
            throw e;
        }

        transactionResponse = new BundleTransactionResponse(this.sortedEntry, this.bundleEntry, this.bundleResponse).get();

        try {
            this.checkRefAfterOp();
        } catch (e) {
            await session.abortTransaction();
            throw e;
        }

        await session.commitTransaction();
        await session.endSession();

        return transactionResponse;
    }

    checkRefAfterOp() {
        let references = jsonPath.nodes(this.sortedEntry, "$.*.resource..reference");

        for (let i = 0; i < references.length; i++) {
            let reference = references[i];
            if (/urn:oid:[0-2](\.[1-9]\d*)+/i.test(reference.value) ||
                uuid.validate(reference.value.replace(/^urn:uuid:/, ""))) {
                throw new FhirWebServiceError(400, `Unable to satisfy placeholder ID ${reference.value} found in path ${reference.path.slice(1).join(".")}`, handleError.processing);
            }
        }

    }

    async doBatch() {
        // TODO: Implement batch
    }

    getResourcesInEntry() {
        return jsonPath.query(this.request.body, "$.entry[*].resource");
    }

    getSortedEntry() {
        let clonedEntry = _.cloneDeep(this.bundleEntry);
        return clonedEntry.sort((a, b) => {
            let secondFullUrl = _.get(b, "fullUrl");
            let firstReferences = jsonPath.query(a, "$.resource..reference");
            if (firstReferences.includes(secondFullUrl)) {
                return 1;
            }
            return -1;
        });
    }

    getIdInUrl(url) {
        let urlMatch = getUrlMatch(url);
        let id;
        if (urlMatch) {
            id = urlMatch[0];
        } else {
            id = url.split("/").pop();
        }
        return id;
    }

    async delete(resourceType, id) {
        return await DeleteService.deleteResourceById(resourceType, id);
    }
}

class BaseTransactionHandler {
    constructor(resourceType, resource, fullUrl, entry, transaction, bundleOpService) {
        this.resourceType = resourceType;
        this.resource = resource;
        this.fullUrl = fullUrl;
        this.entry = entry;
        this.transaction = transaction;
        this.bundleOpService = bundleOpService;
    }

    async replaceIdInEntry(createdResource) {
        let resourcesWithRef = jsonPath.nodes(this.entry, `$.*.resource..reference`).filter(v => v.value === this.fullUrl);

        for (let i = 0; i < resourcesWithRef.length; i++) {
            let itemPath = resourcesWithRef[i].path.slice(1).join(".");
            _.set(this.entry, itemPath, `${this.resourceType}/${createdResource.id}`);
        }
    }
}

class TransactionCreateHandler extends BaseTransactionHandler {
    constructor(resourceType, resource, fullUrl, entry, transaction, bundleOpService) {
        super(resourceType, resource, fullUrl, entry, transaction, bundleOpService);
    }

    async create() {
        // Validate user request body
        let validation = await BaseFhirApiService.validateRequestResource(this.resource);
        if (!validation.status) throw new FhirValidationError(validation.result);

        let { result } = await CreateService.insertResource(this.resourceType, this.resource, this.transaction);
        this.replaceIdInEntry(result);

        if (_.get(result, "resourceType") === "OperationOutcome" && _.get(result, "code") === 422) {
            await this.transaction.abortTransaction();
            throw new FhirValidationError(result);
        }
        let reqBaseUrl = `${this.bundleOpService.request.protocol}://${this.bundleOpService.request.get('host')}/`;
        let fullAbsoluteUrl = urlJoin(`/${process.env.FHIRSERVER_APIPATH}/${this.resourceType}/${result.id}/_history/1`, reqBaseUrl);
        this.bundleOpService.bundleResponse.push({
            status: "201 Created",
            location: fullAbsoluteUrl,
            lastModified: (new Date()).toUTCString()
        });

        return result;
    }
}

class TransactionUpdateHandler extends BaseTransactionHandler {
    constructor(resourceType, resource, fullUrl, entry, transaction, bundleOpService) {
        super(resourceType, resource, fullUrl, entry, transaction, bundleOpService);
    }

    async update() {
        // Validate user request body
        let validation = await BaseFhirApiService.validateRequestResource(this.resource);
        if (!validation.status) throw new FhirValidationError(validation.result);

        let { code, doc } = await UpdateService.insertOrUpdateResource(this.resourceType, this.resource, getIdInFullUrl(this.fullUrl), this.transaction);
        this.replaceIdInEntry(doc);

        if (_.get(doc, "resourceType") === "OperationOutcome" && code === 422) {
            await this.transaction.abortTransaction();
            throw new FhirValidationError(doc.result);
        }
        let reqBaseUrl = `${this.bundleOpService.request.protocol}://${this.bundleOpService.request.get('host')}/`;
        let fullAbsoluteUrl = urlJoin(`/${process.env.FHIRSERVER_APIPATH}/${this.resourceType}/${getIdInFullUrl(this.fullUrl)}/_history/${doc.meta.versionId}`, reqBaseUrl);
        this.bundleOpService.bundleResponse.push({
            status: code.toString(),
            location: fullAbsoluteUrl,
            lastModified: (new Date()).toUTCString()
        });

        return { code, result: doc };
    }
}

class TransactionSearchHandler {
    constructor(resourceRequest, transaction) {
        this.resourceRequest = resourceRequest;
        this.transaction = transaction;
        this.SEARCH_METHOD = {
            "ID": 1,
            "PARAMS": 2
        };
    }

    async search() {
        let urlDetermineResult = await this.determineSearchUrl();
        if (urlDetermineResult.method === this.SEARCH_METHOD.ID) {
            let resource = await ReadService.getResourceById(urlDetermineResult.resourceType, urlDetermineResult.id);
            if (resource) {
                return {
                    code: 200,
                    result: resource
                };
            }

            let errorMessage = `not found ${urlDetermineResult.resourceType}/${urlDetermineResult.id}`;
            let operationOutcomeError = handleError.exception(errorMessage);
            return {
                code: 404,
                result: operationOutcomeError
            };
        } else {
            // TODO: Implement search
            throw new FhirWebServiceError(500, `The url contains params is not supported of ${this.resourceRequest.url}`, handleError.processing);
        }
    }

    async determineSearchUrl() {
        let [resourceType, id] = this.resourceRequest.url.split("/");
        if (resourceList.includes(resourceType) && id) {
            return {
                method: this.SEARCH_METHOD.ID,
                resourceType: resourceType,
                id: id
            };
        }

        let resourceTypeInUrl = getResourceTypeInUrl(this.resourceRequest.url);
        if (resourceList.includes(resourceTypeInUrl)) {
            let urlSplit = this.resourceRequest.url.split("?");
            let paramsStr = urlSplit.slice(
                urlSplit.indexOf("?")
            );
            let params = new URLSearchParams("?" + paramsStr);
            for (let p of params) {
                let [key, value] = p;

                let { paramsSearch } = require(`@root/api/FHIR/${resourceTypeInUrl}/${resourceTypeInUrl}ParametersHandler.js`);
                if (!(Object.keys(paramsSearch).indexOf(key) >= 0)) {
                    throw new FhirWebServiceError(400, `Invalid URL in request ${this.resourceRequest.url} (Unknown parameter: ${key})`, handleError.processing);
                }
            }

            return {
                method: this.SEARCH_METHOD.PARAMS,
                resourceType: resourceType,
                params: params
            };
        }

        throw new FhirWebServiceError(400, `Invalid URL in request ${this.resourceRequest.url}`, handleError.processing);
    }
}

class BundleTransactionResponse {
    constructor(entry, sortedEntry, responses) {
        this.entry = entry;
        this.sortedEntry = sortedEntry;
        this.responses = responses;
    }

    get() {
        let entryMappingIndex = this.getEntryMappingIndex();
        let bundle = {
            resourceType: "Bundle",
            type: "transaction-response",
            entry: []
        };

        for (let i = 0; i < this.responses.length; i++) {
            bundle.entry.push({
                response: this.responses[entryMappingIndex[i]]
            });
        }

        return new mongoose.model("Bundle")(bundle).getFHIRField();
    }

    getEntryMappingIndex() {
        return this.sortedEntry.map((v, i) => {
            return this.entry.findIndex(item => item.fullUrl === v.fullUrl);
        });
    }
}

module.exports.BundleOpService = BundleOpService;