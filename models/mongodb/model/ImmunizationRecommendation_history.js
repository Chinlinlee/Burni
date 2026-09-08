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
    let ImmunizationRecommendation = require('./ImmunizationRecommendation').schema;
    ImmunizationRecommendation.id.unique = false;

    ImmunizationRecommendation.bundleRequest = {
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
    ImmunizationRecommendation.bundleResponse = {
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
    const ImmunizationRecommendationHistorySchema = new schemaConstructor(ImmunizationRecommendation, schemaConfig);
    ImmunizationRecommendationHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    ImmunizationRecommendationHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const ImmunizationRecommendationHistoryModel = modelConnection.model("ImmunizationRecommendation_history", ImmunizationRecommendationHistorySchema, "ImmunizationRecommendation_history");
    return ImmunizationRecommendationHistoryModel;
};