const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationKnowledge_Dosage
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationKnowledge_PatientCharacteristics
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationKnowledge_AdministrationGuidelines
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_AdministrationGuidelines.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    dosage: {
        type: [MedicationKnowledge_Dosage],
        default: void 0
    },
    indicationCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    indicationReference: {
        type: Reference,
        default: void 0
    },
    patientCharacteristics: {
        type: [MedicationKnowledge_PatientCharacteristics],
        default: void 0
    }
});
module.exports.MedicationKnowledge_AdministrationGuidelines = MedicationKnowledge_AdministrationGuidelines;