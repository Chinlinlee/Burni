const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    MedicinalProductPharmaceutical_WithdrawalPeriod
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPharmaceutical_WithdrawalPeriod.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    tissue: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    value: {
        type: Quantity,
        required: true,
        default: void 0
    },
    supportingInformation: string
});
module.exports.MedicinalProductPharmaceutical_WithdrawalPeriod =
    MedicinalProductPharmaceutical_WithdrawalPeriod;
