const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    PlanDefinition_DynamicValue
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_DynamicValue.add({
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
        default: void 0
    }
});
module.exports.PlanDefinition_DynamicValue = PlanDefinition_DynamicValue;
