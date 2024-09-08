const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ImplementationGuide = require('./ImplementationGuide').schema;
    ImplementationGuide.id.unique = false;
    ImplementationGuide.request = {
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
    ImplementationGuide.response = {
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
    const ImplementationGuideHistorySchema = new mongoose.Schema(ImplementationGuide, schemaConfig);
    ImplementationGuideHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ImplementationGuideHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ImplementationGuideHistoryModel = mongoose.model("ImplementationGuide_history", ImplementationGuideHistorySchema, "ImplementationGuide_history");
    return ImplementationGuideHistoryModel;
};