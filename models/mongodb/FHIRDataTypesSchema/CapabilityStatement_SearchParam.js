const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const canonical = require('../FHIRDataTypesSchema/canonical');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    CapabilityStatement_SearchParam
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_SearchParam.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    definition: canonical,
    type: {
        type: String,
        enum: ["number", "date", "string", "token", "reference", "composite", "quantity", "uri", "special"],
        default: void 0
    },
    documentation: markdown
});
module.exports.CapabilityStatement_SearchParam = CapabilityStatement_SearchParam;