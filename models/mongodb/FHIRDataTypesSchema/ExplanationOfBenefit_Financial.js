const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_Financial
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Financial.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    allowedUnsignedInt: {
        type: Number,
        default: void 0
    },
    allowedString: string,
    allowedMoney: {
        type: Money,
        default: void 0
    },
    usedUnsignedInt: {
        type: Number,
        default: void 0
    },
    usedMoney: {
        type: Money,
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Financial = ExplanationOfBenefit_Financial;
