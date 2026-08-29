const _ = require("lodash");
const { isRealObject } = require("../../apiService");
const { logger } = require("@root/utils/log");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");

/**
 * @typedef SearchParameterCreatorOption
 * @property {string} resourceType
 * @property {Object} query
 */

class SearchParameterCreator {
    /**
     *
     * @param {SearchParameterCreatorOption} option
     */
    constructor(option) {
        this.query = option.query;
        this.resourceType = option.resourceType;
    }

    async create() {
        Object.keys(this.query).forEach((key) => {
            if (
                !this.query[key] ||
                isRealObject(this.query[key]) ||
                key == "_include" ||
                key == "_revinclude"
            ) {
                delete this.query[key];
            }
        });

        this.query.$and = [];

        const pendingKeys = Object.keys(this.query).filter((key) => key !== "$and");
        for (const key of pendingKeys) {
            try {
                const registryResult = await tryApplyRegistryParameter({
                    resourceType: this.resourceType,
                    query: this.query,
                    parameterName: key
                });
                if (registryResult === "handled") {
                    continue;
                }

                throw new UnknownSearchParameterError(
                    `Unknown search parameter ${key} or value ${this.query[key]}`
                );
            } catch (e) {
                if (e instanceof UnknownSearchParameterError) {
                    throw e;
                }
                if (key != "$and") {
                    logger.error(e);
                    logger.error(
                        `[Error: Unknown search parameter ${key} or value ${this.query[key]}] [Resource Type: ${this.resourceType}] [${e}]`
                    );
                    throw new UnknownSearchParameterError(
                        `Unknown search parameter ${key} or value ${this.query[key]}`
                    );
                }
            }
        }

        if (this.query.$and.length == 0) {
            delete this.query["$and"];
        }

        return this.query;
    }
}

class UnknownSearchParameterError extends Error {
    constructor(message) {
        super(message);

        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports.SearchParameterCreator = SearchParameterCreator;
module.exports.UnknownSearchParameterError = UnknownSearchParameterError;
