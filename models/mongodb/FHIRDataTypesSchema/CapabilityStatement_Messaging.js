const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_Endpoint
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    CapabilityStatement_SupportedMessage
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CapabilityStatement_Messaging
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Messaging.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    endpoint: {
        type: [CapabilityStatement_Endpoint],
        default: void 0
    },
    reliableCache: unsignedInt,
    documentation: markdown,
    supportedMessage: {
        type: [CapabilityStatement_SupportedMessage],
        default: void 0
    },
    _reliableCache: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _documentation: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    }
});
module.exports.CapabilityStatement_Messaging = CapabilityStatement_Messaging;