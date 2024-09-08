const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let RiskEvidenceSynthesis = require('./RiskEvidenceSynthesis').schema;
    RiskEvidenceSynthesis.id.unique = false;
    RiskEvidenceSynthesis.request = {
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
    RiskEvidenceSynthesis.response = {
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
    const RiskEvidenceSynthesisHistorySchema = new mongoose.Schema(RiskEvidenceSynthesis, schemaConfig);
    RiskEvidenceSynthesisHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    RiskEvidenceSynthesisHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const RiskEvidenceSynthesisHistoryModel = mongoose.model("RiskEvidenceSynthesis_history", RiskEvidenceSynthesisHistorySchema, "RiskEvidenceSynthesis_history");
    return RiskEvidenceSynthesisHistoryModel;
};