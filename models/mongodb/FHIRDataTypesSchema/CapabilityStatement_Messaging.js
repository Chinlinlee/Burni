const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CapabilityStatement_Endpoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const markdown = require("../FHIRDataTypesSchema/markdown");
const {
    CapabilityStatement_SupportedMessage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

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
    }
});
module.exports.CapabilityStatement_Messaging = CapabilityStatement_Messaging;
