const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    Patient_Communication
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Patient_Communication.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    language: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    preferred: boolean
});
module.exports.Patient_Communication = Patient_Communication;
