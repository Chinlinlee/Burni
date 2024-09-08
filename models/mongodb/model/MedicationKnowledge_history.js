const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let MedicationKnowledge = require('./MedicationKnowledge').schema;
    MedicationKnowledge.id.unique = false;
    MedicationKnowledge.request = {
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
    MedicationKnowledge.response = {
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
    const MedicationKnowledgeHistorySchema = new mongoose.Schema(MedicationKnowledge, schemaConfig);
    MedicationKnowledgeHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    MedicationKnowledgeHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const MedicationKnowledgeHistoryModel = mongoose.model("MedicationKnowledge_history", MedicationKnowledgeHistorySchema, "MedicationKnowledge_history");
    return MedicationKnowledgeHistoryModel;
};