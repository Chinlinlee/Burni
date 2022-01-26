const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    InsurancePlan_Benefit1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    InsurancePlan_SpecificCost
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_SpecificCost.add({
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
    benefit: {
        type: [InsurancePlan_Benefit1],
        default: void 0
    }
});
module.exports.InsurancePlan_SpecificCost = InsurancePlan_SpecificCost;