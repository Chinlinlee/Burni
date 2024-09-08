const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ChargeItemDefinition = require('./ChargeItemDefinition').schema;
    ChargeItemDefinition.id.unique = false;
    ChargeItemDefinition.request = {
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
    ChargeItemDefinition.response = {
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
    const ChargeItemDefinitionHistorySchema = new mongoose.Schema(ChargeItemDefinition, schemaConfig);
    ChargeItemDefinitionHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ChargeItemDefinitionHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ChargeItemDefinitionHistoryModel = mongoose.model("ChargeItemDefinition_history", ChargeItemDefinitionHistorySchema, "ChargeItemDefinition_history");
    return ChargeItemDefinitionHistoryModel;
};