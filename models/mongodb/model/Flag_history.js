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
    let Flag = require('./Flag').schema;
    Flag.id.unique = false;

    Flag.bundleRequest = {
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
    Flag.bundleResponse = {
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
    const FlagHistorySchema = new schemaConstructor(Flag, schemaConfig);
    FlagHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    FlagHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const FlagHistoryModel = modelConnection.model("Flag_history", FlagHistorySchema, "Flag_history");
    return FlagHistoryModel;
};