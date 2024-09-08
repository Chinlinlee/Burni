const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let SupplyDelivery = require('./SupplyDelivery').schema;
    SupplyDelivery.id.unique = false;
    SupplyDelivery.request = {
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
    SupplyDelivery.response = {
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
    const SupplyDeliveryHistorySchema = new mongoose.Schema(SupplyDelivery, schemaConfig);
    SupplyDeliveryHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    SupplyDeliveryHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const SupplyDeliveryHistoryModel = mongoose.model("SupplyDelivery_history", SupplyDeliveryHistorySchema, "SupplyDelivery_history");
    return SupplyDeliveryHistoryModel;
};