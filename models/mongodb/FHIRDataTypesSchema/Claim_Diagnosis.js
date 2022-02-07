const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Claim_Diagnosis
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Claim_Diagnosis.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    diagnosisCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    diagnosisReference: {
        type: Reference,
        default: void 0
    },
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    onAdmission: {
        type: CodeableConcept,
        default: void 0
    },
    packageCode: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Claim_Diagnosis = Claim_Diagnosis;