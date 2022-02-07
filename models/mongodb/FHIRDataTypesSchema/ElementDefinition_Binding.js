const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    ElementDefinition_Binding
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Binding.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    strength: {
        type: String,
        enum: ["required", "extensible", "preferred", "example"],
        default: void 0
    },
    description: string,
    valueSet: canonical
});
module.exports.ElementDefinition_Binding = ElementDefinition_Binding;