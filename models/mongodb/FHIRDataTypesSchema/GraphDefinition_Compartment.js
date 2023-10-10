const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");

const {
    GraphDefinition_Compartment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
GraphDefinition_Compartment.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: ["condition", "requirement"],
        default: void 0
    },
    code: code,
    rule: {
        type: String,
        enum: ["identical", "matching", "different", "custom"],
        default: void 0
    },
    expression: string,
    description: string
});
module.exports.GraphDefinition_Compartment = GraphDefinition_Compartment;
