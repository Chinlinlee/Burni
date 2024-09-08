const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let HealthcareService = require('./HealthcareService').schema;
    HealthcareService.id.unique = false;
    HealthcareService.request = {
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
    HealthcareService.response = {
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
    const HealthcareServiceHistorySchema = new mongoose.Schema(HealthcareService, schemaConfig);
    HealthcareServiceHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    HealthcareServiceHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const HealthcareServiceHistoryModel = mongoose.model("HealthcareService_history", HealthcareServiceHistorySchema, "HealthcareService_history");
    return HealthcareServiceHistoryModel;
};