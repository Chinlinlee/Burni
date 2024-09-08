const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let QuestionnaireResponse = require('./QuestionnaireResponse').schema;
    QuestionnaireResponse.id.unique = false;
    QuestionnaireResponse.request = {
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
    QuestionnaireResponse.response = {
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
    const QuestionnaireResponseHistorySchema = new mongoose.Schema(QuestionnaireResponse, schemaConfig);
    QuestionnaireResponseHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    QuestionnaireResponseHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const QuestionnaireResponseHistoryModel = mongoose.model("QuestionnaireResponse_history", QuestionnaireResponseHistorySchema, "QuestionnaireResponse_history");
    return QuestionnaireResponseHistoryModel;
};