const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    let MeasureReport = require('./MeasureReport').schema;
    MeasureReport.id.unique = false;
    MeasureReport.request = {
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
    MeasureReport.response = {
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
    const MeasureReportHistorySchema = new mongoose.Schema(MeasureReport, schemaConfig);
    MeasureReportHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return serializeResourceTemporals(result);
    };
    MeasureReportHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const MeasureReportHistoryModel = mongoose.model("MeasureReport_history", MeasureReportHistorySchema, "MeasureReport_history");
    return MeasureReportHistoryModel;
};