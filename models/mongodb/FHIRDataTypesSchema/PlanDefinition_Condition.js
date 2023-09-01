const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    PlanDefinition_Condition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_Condition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    kind: {
        type: String,
        enum: ["applicability", "start", "stop"],
        default: void 0
    },
    expression: {
        type: Expression,
        default: void 0
    }
});
module.exports.PlanDefinition_Condition = PlanDefinition_Condition;
