const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ActivityDefinition_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ActivityDefinition_Participant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    role: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.ActivityDefinition_Participant = ActivityDefinition_Participant;
