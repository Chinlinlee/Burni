const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const url = require('../FHIRDataTypesSchema/url');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');

const {
    Subscription_Channel
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Subscription_Channel.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["rest-hook", "websocket", "email", "sms", "message"],
        default: void 0
    },
    endpoint: url,
    payload: code,
    header: {
        type: [string],
        default: void 0
    }
});
module.exports.Subscription_Channel = Subscription_Channel;