const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    MedicinalProductPharmaceutical_WithdrawalPeriod
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProductPharmaceutical_TargetSpecies
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPharmaceutical_TargetSpecies.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    withdrawalPeriod: {
        type: [MedicinalProductPharmaceutical_WithdrawalPeriod],
        default: void 0
    }
});
module.exports.MedicinalProductPharmaceutical_TargetSpecies =
    MedicinalProductPharmaceutical_TargetSpecies;
