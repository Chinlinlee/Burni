const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const canonical = require("../FHIRDataTypesSchema/canonical");

const {
    CapabilityStatement_SupportedMessage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_SupportedMessage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    mode: {
        type: String,
        enum: ["sender", "receiver"],
        default: void 0
    },
    definition: canonical
});
module.exports.CapabilityStatement_SupportedMessage =
    CapabilityStatement_SupportedMessage;
