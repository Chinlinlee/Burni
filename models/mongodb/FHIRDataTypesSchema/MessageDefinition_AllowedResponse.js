const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const canonical = require("../FHIRDataTypesSchema/canonical");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    MessageDefinition_AllowedResponse
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MessageDefinition_AllowedResponse.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    message: canonical,
    situation: markdown
});
module.exports.MessageDefinition_AllowedResponse =
    MessageDefinition_AllowedResponse;
