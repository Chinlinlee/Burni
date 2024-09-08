const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let EnrollmentResponse = require('./EnrollmentResponse').schema;
    EnrollmentResponse.id.unique = false;
    EnrollmentResponse.request = {
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
    EnrollmentResponse.response = {
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
    const EnrollmentResponseHistorySchema = new mongoose.Schema(EnrollmentResponse, schemaConfig);
    EnrollmentResponseHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    EnrollmentResponseHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const EnrollmentResponseHistoryModel = mongoose.model("EnrollmentResponse_history", EnrollmentResponseHistorySchema, "EnrollmentResponse_history");
    return EnrollmentResponseHistoryModel;
};