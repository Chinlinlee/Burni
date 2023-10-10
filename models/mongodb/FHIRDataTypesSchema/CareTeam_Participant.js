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
    CareTeam_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CareTeam_Participant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    role: {
        type: [CodeableConcept],
        default: void 0
    },
    member: {
        type: Reference,
        default: void 0
    },
    onBehalfOf: {
        type: Reference,
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.CareTeam_Participant = CareTeam_Participant;
