const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    CapabilityStatement_Document
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Document.add({
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
        enum: ["producer", "consumer"],
        default: void 0
    },
    documentation: markdown,
    profile: canonical
});
module.exports.CapabilityStatement_Document = CapabilityStatement_Document;