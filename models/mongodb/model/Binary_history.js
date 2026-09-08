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
    let Binary = require('./Binary').schema;
    Binary.id.unique = false;

    Binary.bundleRequest = {
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
    Binary.bundleResponse = {
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
    const BinaryHistorySchema = new schemaConstructor(Binary, schemaConfig);
    BinaryHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    BinaryHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const BinaryHistoryModel = modelConnection.model("Binary_history", BinaryHistorySchema, "Binary_history");
    return BinaryHistoryModel;
};