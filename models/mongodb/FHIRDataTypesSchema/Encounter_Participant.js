const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Encounter_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_Participant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    },
    individual: {
        type: Reference,
        default: void 0
    }
});
module.exports.Encounter_Participant = Encounter_Participant;