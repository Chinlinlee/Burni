const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');

const {
    ExplanationOfBenefit_Adjudication
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Adjudication.add({
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
    reason: {
        type: CodeableConcept,
        default: void 0
    },
    amount: {
        type: Money,
        default: void 0
    },
    value: decimal
});
module.exports.ExplanationOfBenefit_Adjudication = ExplanationOfBenefit_Adjudication;