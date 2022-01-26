const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CoverageEligibilityRequest_Diagnosis
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CoverageEligibilityRequest_Diagnosis.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    diagnosisCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    diagnosisReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.CoverageEligibilityRequest_Diagnosis = CoverageEligibilityRequest_Diagnosis;