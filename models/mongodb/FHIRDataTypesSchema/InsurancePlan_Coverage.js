const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    InsurancePlan_Benefit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    InsurancePlan_Coverage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Coverage.add({
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
    network: {
        type: [Reference],
        default: void 0
    },
    benefit: {
        type: [InsurancePlan_Benefit],
        required: true,
        default: void 0
    }
});
module.exports.InsurancePlan_Coverage = InsurancePlan_Coverage;
