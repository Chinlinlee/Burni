const _ = require("lodash");
const { isRealObject } = require("../../apiService");
const {
    checkIsChainAndGetChainParent,
    getChainParentJoinQuery
} = require("./chain-params");

/**
 * @typedef SearchParameterCreatorOption
 * @property {string} resourceType
 * @property {import("log4js").Logger} logger
 * @property {Object} query
 * @property {Object} paramsSearch The mapping function to get MongoDB query JSON from resourceType's search parameters
 */

class SearchParameterCreator {
    /**
     *
     * @param {SearchParameterCreatorOption} option
     */
    constructor(option) {
        this.logger = option.logger;
        this.query = option.query;
        this.resourceType = option.resourceType;
        this.paramsSearch = option.paramsSearch;
    }

    create() {
        // remove empty parameter
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

        // The top level parameter $and to combine search parameters concat with &(and)
        this.query.$and = [];

        for (let key in this.query) {
            try {
                let splitDotLength = key.split(".").length;
                if (splitDotLength >= 2) {
                    if ((key.startsWith("composition") || key.startsWith("message")) &&
                        splitDotLength === 2) {

                        this.paramsSearch[key](this.query);

                    } else {
                        let isChain = checkIsChainAndGetChainParent(
                            this.resourceType,
                            key
                        );
                        if (isChain.status) {
                            this.query["isChain"] = true;
    
                            let joinQuery = getChainParentJoinQuery(
                                isChain.chainParent,
                                this.query[key]
                            );
    
                            if (!_.get(this.query, "chain"))
                                this.query["chain"] = [];
                            this.query["chain"] = [
                                ...this.query["chain"],
                                joinQuery
                            ];
                            delete this.query[key];
                        }
                    }
                } else {
                    this.paramsSearch[key](this.query);
                }
            } catch (e) {
                if (key != "$and") {
                    this.logger.error(e);
                    this.logger.error(
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

        // capturing the stack trace keeps the reference to your error class
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports.SearchParameterCreator = SearchParameterCreator;
module.exports.UnknownSearchParameterError = UnknownSearchParameterError;
