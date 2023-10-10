const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const canonical = require("../FHIRDataTypesSchema/canonical");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const string = require("../FHIRDataTypesSchema/string");

const {
    MessageDefinition_Focus
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MessageDefinition_Focus.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    profile: canonical,
    min: unsignedInt,
    max: string
});
module.exports.MessageDefinition_Focus = MessageDefinition_Focus;
