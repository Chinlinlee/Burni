const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let TerminologyCapabilities = require('./TerminologyCapabilities').schema;
    TerminologyCapabilities.id.unique = false;
    TerminologyCapabilities.request = {
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
    TerminologyCapabilities.response = {
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
    const TerminologyCapabilitiesHistorySchema = new mongoose.Schema(TerminologyCapabilities, schemaConfig);
    TerminologyCapabilitiesHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    TerminologyCapabilitiesHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const TerminologyCapabilitiesHistoryModel = mongoose.model("TerminologyCapabilities_history", TerminologyCapabilitiesHistorySchema, "TerminologyCapabilities_history");
    return TerminologyCapabilitiesHistoryModel;
};