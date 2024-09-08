const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let DocumentReference = require('./DocumentReference').schema;
    DocumentReference.id.unique = false;
    DocumentReference.request = {
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
    DocumentReference.response = {
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
    const DocumentReferenceHistorySchema = new mongoose.Schema(DocumentReference, schemaConfig);
    DocumentReferenceHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    DocumentReferenceHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const DocumentReferenceHistoryModel = mongoose.model("DocumentReference_history", DocumentReferenceHistorySchema, "DocumentReference_history");
    return DocumentReferenceHistoryModel;
};