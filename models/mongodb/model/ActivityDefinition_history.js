const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ActivityDefinition = require('./ActivityDefinition').schema;
    ActivityDefinition.id.unique = false;
    ActivityDefinition.request = {
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
    ActivityDefinition.response = {
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
    const ActivityDefinitionHistorySchema = new mongoose.Schema(ActivityDefinition, schemaConfig);
    ActivityDefinitionHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ActivityDefinitionHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ActivityDefinitionHistoryModel = mongoose.model("ActivityDefinition_history", ActivityDefinitionHistorySchema, "ActivityDefinition_history");
    return ActivityDefinitionHistoryModel;
};