const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let DetectedIssue = require('./DetectedIssue').schema;
    DetectedIssue.id.unique = false;
    DetectedIssue.request = {
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
    DetectedIssue.response = {
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
    const DetectedIssueHistorySchema = new mongoose.Schema(DetectedIssue, schemaConfig);
    DetectedIssueHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    DetectedIssueHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const DetectedIssueHistoryModel = mongoose.model("DetectedIssue_history", DetectedIssueHistorySchema, "DetectedIssue_history");
    return DetectedIssueHistoryModel;
};