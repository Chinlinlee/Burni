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
    let MedicinalProductUndesirableEffect = require('./MedicinalProductUndesirableEffect').schema;
    MedicinalProductUndesirableEffect.id.unique = false;

    MedicinalProductUndesirableEffect.bundleRequest = {
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
    MedicinalProductUndesirableEffect.bundleResponse = {
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
    const MedicinalProductUndesirableEffectHistorySchema = new schemaConstructor(MedicinalProductUndesirableEffect, schemaConfig);
    MedicinalProductUndesirableEffectHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
    };
    MedicinalProductUndesirableEffectHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const MedicinalProductUndesirableEffectHistoryModel = modelConnection.model("MedicinalProductUndesirableEffect_history", MedicinalProductUndesirableEffectHistorySchema, "MedicinalProductUndesirableEffect_history");
    return MedicinalProductUndesirableEffectHistoryModel;
};