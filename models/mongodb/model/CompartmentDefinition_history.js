const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let CompartmentDefinition = require('./CompartmentDefinition').schema;
    CompartmentDefinition.id.unique = false;
    CompartmentDefinition.request = {
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
    CompartmentDefinition.response = {
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
    const CompartmentDefinitionHistorySchema = new mongoose.Schema(CompartmentDefinition, schemaConfig);
    CompartmentDefinitionHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    CompartmentDefinitionHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const CompartmentDefinitionHistoryModel = mongoose.model("CompartmentDefinition_history", CompartmentDefinitionHistorySchema, "CompartmentDefinition_history");
    return CompartmentDefinitionHistoryModel;
};