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
 */

/**
 * @typedef SearchResult
 * @property {Object} docs
 * @property {number} count
 */

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
                    "$match": {
                        $and: this.query.$and
                    }
                };
                aggregateQuery.push(selfMatch);
            }
            aggregateQuery.push(...this.query["chain"].flat());

            aggregateQuery.push({
                $group: {
                    "_id": "$_id",
                    "groupItem": {
                        "$first": "$$ROOT"
                    }
                }
            });
            aggregateQuery.push({
                "$replaceRoot": {
                    "newRoot": "$groupItem"
                }
            });

            aggregateQuery.push({ $skip: this.skip });
            aggregateQuery.push({ $limit: this.limit });

            let docs = await mongoose.model(this.resourceType)
                .aggregate(aggregateQuery)
                .exec();

            let count = 0;
            if (this.totalMode !== "none") {
                aggregateQuery.push({ "$count": "totalDocs" });
                let totalDocs = count = await mongoose.model(this.resourceType)
                    .aggregate(aggregateQuery)
                    .exec();

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
            let docs = await mongoose.model(this.resourceType).find(this.query)
                .limit(this.limit)
                .skip(this.skip)
                .sort({
                    _id: 1
                })
                .exec();


            let count = 0;
            if (this.totalMode !== "none") {
                if (_.isEmpty(this.query)) {

                    if (this.totalMode === "estimate") {
                        count = await mongoose.model(this.resourceType).estimatedDocumentCount();
                    } else if (this.totalMode === "accurate") {
                        count = await mongoose.model(this.resourceType).countDocuments();
                    }

                } else {
                    count = await mongoose.model(this.resourceType).countDocuments(this.query);
                }
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