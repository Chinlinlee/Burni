const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ResearchDefinition = require('./ResearchDefinition').schema;
    ResearchDefinition.id.unique = false;
    ResearchDefinition.request = {
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
    ResearchDefinition.response = {
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
    const ResearchDefinitionHistorySchema = new mongoose.Schema(ResearchDefinition, schemaConfig);
    ResearchDefinitionHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ResearchDefinitionHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ResearchDefinitionHistoryModel = mongoose.model("ResearchDefinition_history", ResearchDefinitionHistorySchema, "ResearchDefinition_history");
    return ResearchDefinitionHistoryModel;
};