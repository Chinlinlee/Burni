const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    InsurancePlan_Limit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Limit.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    value: {
        type: Quantity,
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.InsurancePlan_Limit = InsurancePlan_Limit;
