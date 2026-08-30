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
    InsurancePlan_Cost
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Cost.add({
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
    applicability: {
        type: CodeableConcept,
        default: void 0
    },
    qualifiers: {
        type: [CodeableConcept],
        default: void 0
    },
    value: {
        type: Quantity,
        default: void 0
    }
});
module.exports.InsurancePlan_Cost = InsurancePlan_Cost;