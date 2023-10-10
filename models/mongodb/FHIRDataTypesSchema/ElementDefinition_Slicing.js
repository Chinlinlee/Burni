const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ElementDefinition_Discriminator
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    ElementDefinition_Slicing
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Slicing.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    discriminator: {
        type: [ElementDefinition_Discriminator],
        default: void 0
    },
    description: string,
    ordered: boolean,
    rules: {
        type: String,
        enum: ["closed", "open", "openAtEnd"],
        default: void 0
    }
});
module.exports.ElementDefinition_Slicing = ElementDefinition_Slicing;
