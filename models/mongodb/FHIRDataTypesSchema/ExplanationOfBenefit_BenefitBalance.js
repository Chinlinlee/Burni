const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const string = require("../FHIRDataTypesSchema/string");
const {
    ExplanationOfBenefit_Financial
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_BenefitBalance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_BenefitBalance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    excluded: boolean,
    name: string,
    description: string,
    network: {
        type: CodeableConcept,
        default: void 0
    },
    unit: {
        type: CodeableConcept,
        default: void 0
    },
    term: {
        type: CodeableConcept,
        default: void 0
    },
    financial: {
        type: [ExplanationOfBenefit_Financial],
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_BenefitBalance =
    ExplanationOfBenefit_BenefitBalance;
