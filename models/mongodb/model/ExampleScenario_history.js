const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
module.exports = function() {
    let ExampleScenario = require('./ExampleScenario').schema;
    ExampleScenario.id.unique = false;
    ExampleScenario.request = {
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
    ExampleScenario.response = {
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
    const ExampleScenarioHistorySchema = new mongoose.Schema(ExampleScenario, schemaConfig);
    ExampleScenarioHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    };
    ExampleScenarioHistorySchema.methods.getFHIRBundleField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        delete result['name._id'];
        return result;
    };

    const ExampleScenarioHistoryModel = mongoose.model("ExampleScenario_history", ExampleScenarioHistorySchema, "ExampleScenario_history");
    return ExampleScenarioHistoryModel;
};