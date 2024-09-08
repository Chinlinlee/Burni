const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let RelatedPerson = require('./RelatedPerson').schema;
    RelatedPerson.id.unique = false;
    RelatedPerson.request = {
        "type": Object,
        "method": {
            type: String,
            required: true
        },
        "url": {
            type: String,
            required: true
        }
    };
    RelatedPerson.response = {
        "type": Object,
        "status": {
            type: String,
            required: true
        }
    };
    let schemaConfig = {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        }
    };
    if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
        schemaConfig["shardKey"] = {
            id: 1
        };
    }
    const RelatedPersonHistorySchema = new mongoose.Schema(RelatedPerson, schemaConfig);
    RelatedPersonHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    RelatedPersonHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const RelatedPersonHistoryModel = mongoose.model("RelatedPerson_history", RelatedPersonHistorySchema, "RelatedPerson_history");
    return RelatedPersonHistoryModel;
};