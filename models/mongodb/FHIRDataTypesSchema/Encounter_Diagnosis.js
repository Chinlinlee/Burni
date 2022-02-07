const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');

const {
    Encounter_Diagnosis
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_Diagnosis.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    condition: {
        type: Reference,
        required: true,
        default: void 0
    },
    use: {
        type: CodeableConcept,
        default: void 0
    },
    rank: positiveInt
});
module.exports.Encounter_Diagnosis = Encounter_Diagnosis;