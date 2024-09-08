const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let Questionnaire = require('./Questionnaire').schema;
    Questionnaire.id.unique = false;
    Questionnaire.request = {
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
    Questionnaire.response = {
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
    const QuestionnaireHistorySchema = new mongoose.Schema(Questionnaire, schemaConfig);
    QuestionnaireHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    QuestionnaireHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const QuestionnaireHistoryModel = mongoose.model("Questionnaire_history", QuestionnaireHistorySchema, "Questionnaire_history");
    return QuestionnaireHistoryModel;
};