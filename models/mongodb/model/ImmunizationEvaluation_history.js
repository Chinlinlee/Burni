const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
const {
    stripHistoryProvenanceForVread
} = require("../historyProvenance");
module.exports = function(connection = mongoose) {
    const modelConnection = connection;
    const schemaConstructor = modelConnection.base?.Schema || mongoose.Schema;
    let ImmunizationEvaluation = require('./ImmunizationEvaluation').schema;
    ImmunizationEvaluation.id.unique = false;

    ImmunizationEvaluation.bundleRequest = {
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
    ImmunizationEvaluation.bundleResponse = {
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
    const ImmunizationEvaluationHistorySchema = new schemaConstructor(ImmunizationEvaluation, schemaConfig);
    ImmunizationEvaluationHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    ImmunizationEvaluationHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const ImmunizationEvaluationHistoryModel = modelConnection.model("ImmunizationEvaluation_history", ImmunizationEvaluationHistorySchema, "ImmunizationEvaluation_history");
    return ImmunizationEvaluationHistoryModel;
};