const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PlanDefinition_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_Participant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["patient", "practitioner", "related-person", "device"],
        default: void 0
    },
    role: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.PlanDefinition_Participant = PlanDefinition_Participant;