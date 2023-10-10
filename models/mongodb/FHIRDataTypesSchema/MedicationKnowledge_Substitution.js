const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    MedicationKnowledge_Substitution
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Substitution.add({
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
    allowed: boolean
});
module.exports.MedicationKnowledge_Substitution =
    MedicationKnowledge_Substitution;
