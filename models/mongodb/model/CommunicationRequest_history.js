const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let CommunicationRequest = require('./CommunicationRequest').schema;
    CommunicationRequest.id.unique = false;
    CommunicationRequest.request = {
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
    CommunicationRequest.response = {
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
    const CommunicationRequestHistorySchema = new mongoose.Schema(CommunicationRequest, schemaConfig);
    CommunicationRequestHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    CommunicationRequestHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const CommunicationRequestHistoryModel = mongoose.model("CommunicationRequest_history", CommunicationRequestHistorySchema, "CommunicationRequest_history");
    return CommunicationRequestHistoryModel;
};