const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let Bundle = require('./Bundle').schema;
    Bundle.id.unique = false;
    Bundle.request = {
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
    Bundle.response = {
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
    const BundleHistorySchema = new mongoose.Schema(Bundle, schemaConfig);
    BundleHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    BundleHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const BundleHistoryModel = mongoose.model("Bundle_history", BundleHistorySchema, "Bundle_history");
    return BundleHistoryModel;
};