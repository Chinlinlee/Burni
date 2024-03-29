const _ = require("lodash");
const mongoose = require("mongoose");
const jsonPath = require("jsonpath");
const qs = require("qs");

const {
    getDeleteMessage,
    handleError,
    FhirWebServiceError,
    FhirValidationError,
    ErrorOperationOutcome
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
const { SearchService } = require("./search.service");

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
            if (fullUrlSplit.length !== 2 ||
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
        let transactionHandler = new TransactionHandler(this);
        return await transactionHandler.executeTransaction();
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
        let entryWithIdx = [];
        
        for(let i = 0 ; i < clonedEntry.length; i++){
            entryWithIdx.push({
                item: clonedEntry[i],
                idx: i
            });
        }

        return entryWithIdx.sort((a, b) => {
            let secondFullUrl = _.get(b.item, "fullUrl");
            let firstReferences = jsonPath.query(a.item, "$.resource..reference");
            if (firstReferences.includes(secondFullUrl)) {
                return 1;
            }
            return -1;
        });
    }
}

class TransactionHandler {
    constructor(bundleOpService) {
        this.bundleOpService = bundleOpService;
        this.opMethod = {
            "POST": (item) => this.create(item),
            "PUT": (item) => this.update(item),
            "DELETE": (item) => this.delete(item),
            "GET": (item) => this.search(item)
        };
    }

    async executeTransaction() {
        let transactionResponse;
        this.session = await mongoose.startSession();
        this.session.startTransaction();

        for (let item of this.bundleOpService.sortedEntry) {
            let method = _.get(item, "item.request.method");

            try {
                await this.opMethod[method](item.item);
            } catch (e) {
                await this.session.abortTransaction();
                if (e.message.includes("defined")) {
                    throw new FhirWebServiceError(400, "Unknown method, only support GET, POST, PUT and DELETE", handleError.processing);
                }
                throw e;
            }
        }

        transactionResponse = new BundleTransactionResponse(this.bundleOpService.sortedEntry, this.bundleOpService.bundleEntry, this.bundleOpService.bundleResponse).get();

        try {
            this.bundleOpService.checkRefAfterOp();
        } catch (e) {
            await this.session.abortTransaction();
            throw e;
        }

        await this.session.commitTransaction();
        await this.session.endSession();

        return transactionResponse;
    }

    async create(item) {
        logger.info("[Info: transaction create] resource: " + JSON.stringify(item));
        let createHandler = new TransactionCreateHandler(item, this.session, this.bundleOpService);
        await createHandler.create();
    }

    async update(item) {
        logger.info("[Info: transaction update] resource: " + JSON.stringify(item));
        let updateHandler = new TransactionUpdateHandler(item, this.session, this.bundleOpService);
        await updateHandler.update();
    }

    async delete(item) {
        let request = _.get(item, "request");
        let resourceType = _.get(item, "resource.resourceType") || getResourceTypeInUrl(request.url);

        logger.info("[Info: transaction delete] resource: " + getIdInFullUrl(request.url));
        let deleteResult = await DeleteService.deleteResourceById(resourceType, getIdInFullUrl(request.url));
        if (_.isString(deleteResult.result) && deleteResult.result.includes("not found")) {
            this.bundleOpService.bundleResponse.push({
                response: {
                    status: "404 NOT FOUND"
                }
            });
        } else {
            this.bundleOpService.bundleResponse.push({
                response: {
                    status: "200 DELETE"
                }
            });
        }
    }

    async search(item) {
        let request = _.get(item, "request");

        let searchHandler = new TransactionSearchHandler(request, this.session, this.bundleOpService.request, this.bundleOpService.response);
        let { code, result } = await searchHandler.search();
        let bundleResponse = {
            response: {
                status: code.toString()
            }
        };

        if (result.resourceType === "OperationOutcome") {
            _.set(bundleResponse, "response.outcome", result);
        } else {
            _.set(bundleResponse, "resource", result);
        }

        this.bundleOpService.bundleResponse.push(bundleResponse);
    }

}

class BaseTransactionHandler {
    constructor(entryItem, transaction, bundleOpService) {
        let request = _.get(entryItem, "request");
        this.resourceType = _.get(entryItem, "resource.resourceType") || getResourceTypeInUrl(request.url);
        this.resource = _.get(entryItem, "resource");
        this.fullUrl = _.get(entryItem, "fullUrl");;
        this.entry = bundleOpService.sortedEntry;

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
    constructor(entryItem, transaction, bundleOpService) {
        super(entryItem, transaction, bundleOpService);
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
            response: {
                status: "201 Created",
                location: fullAbsoluteUrl,
                lastModified: (new Date()).toUTCString()
            }
        });

        return result;
    }
}

class TransactionUpdateHandler extends BaseTransactionHandler {
    constructor(entryItem, transaction, bundleOpService) {
        super(entryItem, transaction, bundleOpService);
    }

    async update() {
        // Validate user request body
        let validation = await BaseFhirApiService.validateRequestResource(this.resource);
        if (!validation.status) throw new FhirValidationError(validation.result);

        let { code, result } = await UpdateService.insertOrUpdateResource(this.resourceType, this.resource, getIdInFullUrl(this.fullUrl), this.transaction);
        this.replaceIdInEntry(result);

        let reqBaseUrl = `${this.bundleOpService.request.protocol}://${this.bundleOpService.request.get('host')}/`;
        let fullAbsoluteUrl = urlJoin(`/${process.env.FHIRSERVER_APIPATH}/${this.resourceType}/${getIdInFullUrl(this.fullUrl)}/_history/${result.meta.versionId}`, reqBaseUrl);
        this.bundleOpService.bundleResponse.push({
            response: {
                status: code.toString(),
                location: fullAbsoluteUrl,
                lastModified: (new Date()).toUTCString()
            }
        });

        return { code, result };
    }
}

class TransactionSearchHandler {
    constructor(resourceRequest, transaction, httpRequest, httpResponse) {
        this.resourceRequest = resourceRequest;
        this.transaction = transaction;
        this.httpRequest = httpRequest;
        this.httpResponse = httpResponse;
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
            const { paramsSearch } = require(`@root/api/FHIR/${urlDetermineResult.resourceType}/${urlDetermineResult.resourceType}ParametersHandler`);
            let httpRequestClone = _.cloneDeep(this.httpRequest);
            let queryOfUrl = qs.parse(urlDetermineResult.params.toString());
            _.set(httpRequestClone, "query", queryOfUrl);

            let searchService = new SearchService(
                httpRequestClone,
                _.cloneDeep(this.httpResponse),
                urlDetermineResult.resourceType,
                paramsSearch
            );
            let { status, code, result } = await searchService.search();

            if (!status) {
                throw new ErrorOperationOutcome(code, result);
            }

            return {
                code: 200,
                result
            };

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
                resourceType: resourceTypeInUrl,
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
            bundle.entry.push(this.responses[entryMappingIndex[i]]);
        }

        return new mongoose.model("Bundle")(bundle).getFHIRField();
    }

    getEntryMappingIndex() {
        return this.entry.map((v, i) => v.idx);
    }
}

module.exports.BundleOpService = BundleOpService;