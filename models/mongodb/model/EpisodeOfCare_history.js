const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    let EpisodeOfCare = require('./EpisodeOfCare').schema;
    EpisodeOfCare.id.unique = false;
    EpisodeOfCare.request = {
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
    EpisodeOfCare.response = {
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
    const EpisodeOfCareHistorySchema = new mongoose.Schema(EpisodeOfCare, schemaConfig);
    EpisodeOfCareHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return serializeResourceTemporals(result);
    };
    EpisodeOfCareHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const EpisodeOfCareHistoryModel = mongoose.model("EpisodeOfCare_history", EpisodeOfCareHistorySchema, "EpisodeOfCare_history");
    return EpisodeOfCareHistoryModel;
};