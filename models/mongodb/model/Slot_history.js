const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    let Slot = require('./Slot').schema;
    Slot.id.unique = false;
    Slot.request = {
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
    Slot.response = {
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
    const SlotHistorySchema = new mongoose.Schema(Slot, schemaConfig);
    SlotHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return serializeResourceTemporals(result);
    };
    SlotHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const SlotHistoryModel = mongoose.model("Slot_history", SlotHistorySchema, "Slot_history");
    return SlotHistoryModel;
};