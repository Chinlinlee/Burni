const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Appointment_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Appointment_Participant.add({
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
    actor: {
        type: Reference,
        default: void 0
    },
    required: {
        type: String,
        enum: ["required", "optional", "information-only"],
        default: void 0
    },
    status: {
        type: String,
        enum: ["accepted", "declined", "tentative", "needs-action"],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Appointment_Participant = Appointment_Participant;
