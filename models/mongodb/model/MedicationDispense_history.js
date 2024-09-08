const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let MedicationDispense = require('./MedicationDispense').schema;
    MedicationDispense.id.unique = false;
    MedicationDispense.request = {
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
    MedicationDispense.response = {
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
    const MedicationDispenseHistorySchema = new mongoose.Schema(MedicationDispense, schemaConfig);
    MedicationDispenseHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    MedicationDispenseHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const MedicationDispenseHistoryModel = mongoose.model("MedicationDispense_history", MedicationDispenseHistorySchema, "MedicationDispense_history");
    return MedicationDispenseHistoryModel;
};