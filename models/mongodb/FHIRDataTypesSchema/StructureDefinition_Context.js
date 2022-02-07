const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    StructureDefinition_Context
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureDefinition_Context.add({
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
        enum: ["fhirpath", "element", "extension"],
        default: void 0
    },
    expression: string
});
module.exports.StructureDefinition_Context = StructureDefinition_Context;