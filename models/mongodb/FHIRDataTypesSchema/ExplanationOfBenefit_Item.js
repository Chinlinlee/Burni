const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Address
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    ExplanationOfBenefit_Adjudication
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ExplanationOfBenefit_Detail
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ExplanationOfBenefit_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Item.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    careTeamSequence: {
        type: [positiveInt],
        default: void 0
    },
    diagnosisSequence: {
        type: [positiveInt],
        default: void 0
    },
    procedureSequence: {
        type: [positiveInt],
        default: void 0
    },
    informationSequence: {
        type: [positiveInt],
        default: void 0
    },
    revenue: {
        type: CodeableConcept,
        default: void 0
    },
    category: {
        type: CodeableConcept,
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
    programCode: {
        type: [CodeableConcept],
        default: void 0
    },
    servicedDate: string,
    servicedPeriod: {
        type: Period,
        default: void 0
    },
    locationCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    locationAddress: {
        type: Address,
        default: void 0
    },
    locationReference: {
        type: Reference,
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
    udi: {
        type: [Reference],
        default: void 0
    },
    bodySite: {
        type: CodeableConcept,
        default: void 0
    },
    subSite: {
        type: [CodeableConcept],
        default: void 0
    },
    encounter: {
        type: [Reference],
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
    detail: {
        type: [ExplanationOfBenefit_Detail],
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Item = ExplanationOfBenefit_Item;