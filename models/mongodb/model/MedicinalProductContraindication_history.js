const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const {
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    let MedicinalProductContraindication = require('./MedicinalProductContraindication').schema;
    MedicinalProductContraindication.id.unique = false;
    MedicinalProductContraindication.request = {
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
    MedicinalProductContraindication.response = {
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
    const MedicinalProductContraindicationHistorySchema = new mongoose.Schema(MedicinalProductContraindication, schemaConfig);
    MedicinalProductContraindicationHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return serializeResourceTemporals(result);
    };
    MedicinalProductContraindicationHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return serializeResourceTemporals(result);
    };

    const MedicinalProductContraindicationHistoryModel = mongoose.model("MedicinalProductContraindication_history", MedicinalProductContraindicationHistorySchema, "MedicinalProductContraindication_history");
    return MedicinalProductContraindicationHistoryModel;
};