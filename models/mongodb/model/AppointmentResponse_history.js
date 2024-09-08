const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let AppointmentResponse = require('./AppointmentResponse').schema;
    AppointmentResponse.id.unique = false;
    AppointmentResponse.request = {
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
    AppointmentResponse.response = {
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
    const AppointmentResponseHistorySchema = new mongoose.Schema(AppointmentResponse, schemaConfig);
    AppointmentResponseHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    AppointmentResponseHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const AppointmentResponseHistoryModel = mongoose.model("AppointmentResponse_history", AppointmentResponseHistorySchema, "AppointmentResponse_history");
    return AppointmentResponseHistoryModel;
};