const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    MedicationKnowledge_PatientCharacteristics
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_PatientCharacteristics.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    characteristicCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    characteristicQuantity: {
        type: Quantity,
        default: void 0
    },
    value: {
        type: [string],
        default: void 0
    }
});
module.exports.MedicationKnowledge_PatientCharacteristics = MedicationKnowledge_PatientCharacteristics;