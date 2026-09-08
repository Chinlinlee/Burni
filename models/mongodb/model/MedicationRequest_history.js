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
    let MedicationRequest = require('./MedicationRequest').schema;
    MedicationRequest.id.unique = false;

    MedicationRequest.bundleRequest = {
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
    MedicationRequest.bundleResponse = {
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
    const MedicationRequestHistorySchema = new schemaConstructor(MedicationRequest, schemaConfig);
    MedicationRequestHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    MedicationRequestHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const MedicationRequestHistoryModel = modelConnection.model("MedicationRequest_history", MedicationRequestHistorySchema, "MedicationRequest_history");
    return MedicationRequestHistoryModel;
};