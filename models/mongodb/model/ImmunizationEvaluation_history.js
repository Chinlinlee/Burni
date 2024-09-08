const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ImmunizationEvaluation = require('./ImmunizationEvaluation').schema;
    ImmunizationEvaluation.id.unique = false;
    ImmunizationEvaluation.request = {
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
    ImmunizationEvaluation.response = {
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
    const ImmunizationEvaluationHistorySchema = new mongoose.Schema(ImmunizationEvaluation, schemaConfig);
    ImmunizationEvaluationHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ImmunizationEvaluationHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ImmunizationEvaluationHistoryModel = mongoose.model("ImmunizationEvaluation_history", ImmunizationEvaluationHistorySchema, "ImmunizationEvaluation_history");
    return ImmunizationEvaluationHistoryModel;
};