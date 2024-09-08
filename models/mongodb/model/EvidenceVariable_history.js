const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let EvidenceVariable = require('./EvidenceVariable').schema;
    EvidenceVariable.id.unique = false;
    EvidenceVariable.request = {
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
    EvidenceVariable.response = {
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
    const EvidenceVariableHistorySchema = new mongoose.Schema(EvidenceVariable, schemaConfig);
    EvidenceVariableHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    EvidenceVariableHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const EvidenceVariableHistoryModel = mongoose.model("EvidenceVariable_history", EvidenceVariableHistorySchema, "EvidenceVariable_history");
    return EvidenceVariableHistoryModel;
};