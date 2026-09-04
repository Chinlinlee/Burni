const _ = require("lodash");
const { isRealObject } = require("../../apiService");
const { logger } = require("@root/utils/log");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const {
    RelationLimitSearchParameterError
} = require("@models/FHIR/searchParameter/runtime/relationLimitErrors");
const {
    UnknownSearchParameterError,
    InvalidSearchParameterValueError
} = require("@models/FHIR/searchParameter/runtime/searchParameterErrors");

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

                throw new UnknownSearchParameterError(key, this.query[key]);
            } catch (e) {
                if (
                    e instanceof UnknownSearchParameterError ||
                    e instanceof RelationLimitSearchParameterError ||
                    e instanceof InvalidSearchParameterValueError
                ) {
                    throw e;
                }
                logger.error(e);
                logger.error(
                    `[Error: Search parameter processing failed for ${key}] [Resource Type: ${this.resourceType}] [${e}]`
                );
                throw e;
            }
        }

        if (this.query.$and.length == 0) {
            delete this.query["$and"];
        }

        return this.query;
    }
}

module.exports.SearchParameterCreator = SearchParameterCreator;
module.exports.UnknownSearchParameterError = UnknownSearchParameterError;
module.exports.InvalidSearchParameterValueError = InvalidSearchParameterValueError;
module.exports.RelationLimitSearchParameterError = RelationLimitSearchParameterError;
