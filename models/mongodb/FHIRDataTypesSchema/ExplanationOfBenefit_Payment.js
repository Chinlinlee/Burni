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
const date = require('../FHIRDataTypesSchema/date');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ExplanationOfBenefit_Payment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Payment.add({
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
        default: void 0
    },
    adjustment: {
        type: Money,
        default: void 0
    },
    adjustmentReason: {
        type: CodeableConcept,
        default: void 0
    },
    date: date,
    amount: {
        type: Money,
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Payment = ExplanationOfBenefit_Payment;