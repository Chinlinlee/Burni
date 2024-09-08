const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let SubstanceReferenceInformation = require('./SubstanceReferenceInformation').schema;
    SubstanceReferenceInformation.id.unique = false;
    SubstanceReferenceInformation.request = {
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
    SubstanceReferenceInformation.response = {
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
    const SubstanceReferenceInformationHistorySchema = new mongoose.Schema(SubstanceReferenceInformation, schemaConfig);
    SubstanceReferenceInformationHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    SubstanceReferenceInformationHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const SubstanceReferenceInformationHistoryModel = mongoose.model("SubstanceReferenceInformation_history", SubstanceReferenceInformationHistorySchema, "SubstanceReferenceInformation_history");
    return SubstanceReferenceInformationHistoryModel;
};