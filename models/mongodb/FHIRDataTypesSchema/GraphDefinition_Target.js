const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");
const canonical = require("../FHIRDataTypesSchema/canonical");
const {
    GraphDefinition_Compartment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    GraphDefinition_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    GraphDefinition_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
GraphDefinition_Target.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    params: string,
    profile: canonical,
    compartment: {
        type: [GraphDefinition_Compartment],
        default: void 0
    },
    link: {
        type: [GraphDefinition_Link],
        default: void 0
    }
});
module.exports.GraphDefinition_Target = GraphDefinition_Target;
