const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function(connection = mongoose) {
    const modelConnection = connection;
    const schemaConstructor = modelConnection.base?.Schema || mongoose.Schema;
    let EffectEvidenceSynthesis = require('./EffectEvidenceSynthesis').schema;
    EffectEvidenceSynthesis.id.unique = false;
    EffectEvidenceSynthesis.request = {
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
    EffectEvidenceSynthesis.response = {
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
    const EffectEvidenceSynthesisHistorySchema = new schemaConstructor(EffectEvidenceSynthesis, schemaConfig);
    EffectEvidenceSynthesisHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return serializeResourceTemporals(result);
    };
    EffectEvidenceSynthesisHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const EffectEvidenceSynthesisHistoryModel = modelConnection.model("EffectEvidenceSynthesis_history", EffectEvidenceSynthesisHistorySchema, "EffectEvidenceSynthesis_history");
    return EffectEvidenceSynthesisHistoryModel;
};