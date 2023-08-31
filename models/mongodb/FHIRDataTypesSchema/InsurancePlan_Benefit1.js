const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    InsurancePlan_Cost
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    InsurancePlan_Benefit1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Benefit1.add({
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
    cost: {
        type: [InsurancePlan_Cost],
        default: void 0
    }
});
module.exports.InsurancePlan_Benefit1 = InsurancePlan_Benefit1;
