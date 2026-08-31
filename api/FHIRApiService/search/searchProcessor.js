/**
 * The class for executing "search"
 * @author Chin-Lin Lee <a5566qq2581@gmail.com>
 */

const mongoose = require("mongoose");
const _ = require("lodash");

/**
 * @typedef SearchProcessorOptions
 * @property {string} resourceType
 * @property {boolean} isChain
 * @property {Object} query
 * @property {number} skip
 * @property {number} limit
 * @property {string} totalMode
 * @property {SearchExecutionInterface} [execution]
 */

/**
 * @typedef SearchResult
 * @property {Object} docs
 * @property {number} count
 */

/**
 * @typedef {Object} SearchExecutionInterface
 * @property {(options: { model: import('mongoose').Model, filter: Object, skip: number, limit: number }) => Promise<Object[]>} find
 * @property {(options: { model: import('mongoose').Model, pipeline: Object[], filter: Object }) => Promise<Object[]>} aggregate
 * @property {(options: { model: import('mongoose').Model, filter: Object, totalMode: string }) => Promise<number>} count
 */

/**
 * @returns {SearchExecutionInterface}
 */
function createMongooseSearchExecution() {
    return {
        find: ({ model, filter, skip, limit }) =>
            model
                .find(filter)
                .limit(limit)
                .skip(skip)
                .sort({
                    _id: 1
                })
                .exec(),
        aggregate: ({ model, pipeline }) => model.aggregate(pipeline).exec(),
        count: async ({ model, filter, totalMode }) => {
            if (_.isEmpty(filter)) {
                if (totalMode === "estimate") {
                    return model.estimatedDocumentCount();
                }
                if (totalMode === "accurate") {
                    return model.countDocuments();
                }
                return 0;
            }
            return model.countDocuments(filter);
        }
    };
}

class SearchProcessor {
    /**
     * @param {SearchProcessorOptions} options
     */
    constructor(options) {
        this.resourceType = options.resourceType;
        this.isChain = options.isChain;
        this.query = options.query;
        this.skip = options.skip;
        this.limit = options.limit;
        this.totalMode = options.totalMode;
        this.execution = options.execution || createMongooseSearchExecution();
    }

    /**
     *
     * @return {SearchResult}
     */
    async search() {
        try {
            if (this.isChain) {
                return await this.searchChain_();
            } else {
                return await this.searchNormal_();
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * @private
     * @return {SearchResult}
     */
    async searchChain_() {
        try {
            let aggregateQuery = [];
            if (_.get(this.query, "$and", []).length > 0) {
                let selfMatch = {
                    $match: {
                        $and: this.query.$and
                    }
                };
                aggregateQuery.push(selfMatch);
            }
            aggregateQuery.push(...this.query["chain"].flat());

            aggregateQuery.push({
                $group: {
                    _id: "$_id",
                    groupItem: {
                        $first: "$$ROOT"
                    }
                }
            });
            aggregateQuery.push({
                $replaceRoot: {
                    newRoot: "$groupItem"
                }
            });

            aggregateQuery.push({ $skip: this.skip });
            aggregateQuery.push({ $limit: this.limit });

            const model = mongoose.model(this.resourceType);
            let docs = await this.execution.aggregate({
                model,
                pipeline: aggregateQuery,
                filter: this.query
            });

            let count = 0;
            if (this.totalMode !== "none") {
                aggregateQuery.push({ $count: "totalDocs" });
                let totalDocs = (count = await this.execution.aggregate({
                    model,
                    pipeline: aggregateQuery,
                    filter: this.query
                }));

                count = _.get(totalDocs, "0.totalDocs", 0);
            }

            return {
                docs: docs,
                count: count
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * @private
     * @return {SearchResult}
     */
    async searchNormal_() {
        try {
            const model = mongoose.model(this.resourceType);
            let docs = await this.execution.find({
                model,
                filter: this.query,
                skip: this.skip,
                limit: this.limit
            });

            let count = 0;
            if (this.totalMode !== "none") {
                count = await this.execution.count({
                    model,
                    filter: this.query,
                    totalMode: this.totalMode
                });
            }

            return {
                docs: docs,
                count: count
            };
        } catch (e) {
            throw e;
        }
    }
}

module.exports.SearchProcessor = SearchProcessor;
module.exports.createMongooseSearchExecution = createMongooseSearchExecution;
