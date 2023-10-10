const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    ChargeItemDefinition_Applicability
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ChargeItemDefinition_Applicability.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    language: string,
    expression: string
});
module.exports.ChargeItemDefinition_Applicability =
    ChargeItemDefinition_Applicability;
