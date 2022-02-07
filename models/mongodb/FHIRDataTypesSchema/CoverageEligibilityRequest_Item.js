const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    CodeableConcept
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
const {
    CoverageEligibilityRequest_Diagnosis
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CoverageEligibilityRequest_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CoverageEligibilityRequest_Item.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    supportingInfoSequence: {
        type: [positiveInt],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        default: void 0
    },
    productOrService: {
        type: CodeableConcept,
        default: void 0
    },
    modifier: {
        type: [CodeableConcept],
        default: void 0
    },
    provider: {
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
    facility: {
        type: Reference,
        default: void 0
    },
    diagnosis: {
        type: [CoverageEligibilityRequest_Diagnosis],
        default: void 0
    },
    detail: {
        type: [Reference],
        default: void 0
    }
});
module.exports.CoverageEligibilityRequest_Item = CoverageEligibilityRequest_Item;