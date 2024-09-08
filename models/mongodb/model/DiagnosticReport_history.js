const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let DiagnosticReport = require('./DiagnosticReport').schema;
    DiagnosticReport.id.unique = false;
    DiagnosticReport.request = {
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
    DiagnosticReport.response = {
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
    const DiagnosticReportHistorySchema = new mongoose.Schema(DiagnosticReport, schemaConfig);
    DiagnosticReportHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    DiagnosticReportHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const DiagnosticReportHistoryModel = mongoose.model("DiagnosticReport_history", DiagnosticReportHistorySchema, "DiagnosticReport_history");
    return DiagnosticReportHistoryModel;
};