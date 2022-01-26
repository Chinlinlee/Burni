const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Encounter_Hospitalization
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_Hospitalization.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    preAdmissionIdentifier: {
        type: Identifier,
        default: void 0
    },
    origin: {
        type: Reference,
        default: void 0
    },
    admitSource: {
        type: CodeableConcept,
        default: void 0
    },
    reAdmission: {
        type: CodeableConcept,
        default: void 0
    },
    dietPreference: {
        type: [CodeableConcept],
        default: void 0
    },
    specialCourtesy: {
        type: [CodeableConcept],
        default: void 0
    },
    specialArrangement: {
        type: [CodeableConcept],
        default: void 0
    },
    destination: {
        type: Reference,
        default: void 0
    },
    dischargeDisposition: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Encounter_Hospitalization = Encounter_Hospitalization;