const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let SupplyRequest = require('./SupplyRequest').schema;
    SupplyRequest.id.unique = false;
    SupplyRequest.request = {
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
    SupplyRequest.response = {
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
    const SupplyRequestHistorySchema = new mongoose.Schema(SupplyRequest, schemaConfig);
    SupplyRequestHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    SupplyRequestHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const SupplyRequestHistoryModel = mongoose.model("SupplyRequest_history", SupplyRequestHistorySchema, "SupplyRequest_history");
    return SupplyRequestHistoryModel;
};