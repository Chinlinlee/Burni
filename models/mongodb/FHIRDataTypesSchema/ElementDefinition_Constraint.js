const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const string = require("../FHIRDataTypesSchema/string");
const canonical = require("../FHIRDataTypesSchema/canonical");

const {
    ElementDefinition_Constraint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Constraint.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    key: id,
    requirements: string,
    severity: {
        type: String,
        enum: ["error", "warning"],
        default: void 0
    },
    human: string,
    expression: string,
    xpath: string,
    source: canonical
});
module.exports.ElementDefinition_Constraint = ElementDefinition_Constraint;
