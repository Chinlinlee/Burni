const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ElementDefinition_Discriminator
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Discriminator.add({
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
        enum: ["value", "exists", "pattern", "type", "profile"],
        default: void 0
    },
    path: string
});
module.exports.ElementDefinition_Discriminator = ElementDefinition_Discriminator;