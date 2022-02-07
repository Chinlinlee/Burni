const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationRequest_Substitution
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationRequest_Substitution.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    allowedBoolean: boolean,
    allowedCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    reason: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.MedicationRequest_Substitution = MedicationRequest_Substitution;