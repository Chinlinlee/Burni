const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ChargeItemDefinition_PriceComponent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ChargeItemDefinition_PriceComponent.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    code: {
        type: CodeableConcept,
        default: void 0
    },
    factor: decimal,
    amount: {
        type: Money,
        default: void 0
    }
});
module.exports.ChargeItemDefinition_PriceComponent =
    ChargeItemDefinition_PriceComponent;
