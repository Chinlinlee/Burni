const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let EnrollmentRequest = require('./EnrollmentRequest').schema;
    EnrollmentRequest.id.unique = false;
    EnrollmentRequest.request = {
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
    EnrollmentRequest.response = {
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
    const EnrollmentRequestHistorySchema = new mongoose.Schema(EnrollmentRequest, schemaConfig);
    EnrollmentRequestHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    EnrollmentRequestHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const EnrollmentRequestHistoryModel = mongoose.model("EnrollmentRequest_history", EnrollmentRequestHistorySchema, "EnrollmentRequest_history");
    return EnrollmentRequestHistoryModel;
};