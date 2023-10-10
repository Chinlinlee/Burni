const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    InsurancePlan_Limit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    InsurancePlan_Benefit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Benefit.add({
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
    requirement: string,
    limit: {
        type: [InsurancePlan_Limit],
        default: void 0
    }
});
module.exports.InsurancePlan_Benefit = InsurancePlan_Benefit;
