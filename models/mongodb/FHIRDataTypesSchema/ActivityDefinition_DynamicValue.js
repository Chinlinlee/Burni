const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ActivityDefinition_DynamicValue
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ActivityDefinition_DynamicValue.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    expression: {
        type: Expression,
        required: true,
        default: void 0
    }
});
module.exports.ActivityDefinition_DynamicValue =
    ActivityDefinition_DynamicValue;
