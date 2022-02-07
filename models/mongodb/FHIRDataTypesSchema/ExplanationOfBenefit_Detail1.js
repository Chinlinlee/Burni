const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    ExplanationOfBenefit_Adjudication
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ExplanationOfBenefit_SubDetail1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ExplanationOfBenefit_Detail1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Detail1.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    productOrService: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    modifier: {
        type: [CodeableConcept],
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    unitPrice: {
        type: Money,
        default: void 0
    },
    factor: decimal,
    net: {
        type: Money,
        default: void 0
    },
    noteNumber: {
        type: [positiveInt],
        default: void 0
    },
    adjudication: {
        type: [ExplanationOfBenefit_Adjudication],
        default: void 0
    },
    subDetail: {
        type: [ExplanationOfBenefit_SubDetail1],
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Detail1 = ExplanationOfBenefit_Detail1;