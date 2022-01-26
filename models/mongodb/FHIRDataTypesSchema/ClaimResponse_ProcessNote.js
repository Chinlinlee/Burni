const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ClaimResponse_ProcessNote
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_ProcessNote.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    number: positiveInt,
    type: {
        type: String,
        enum: ["display", "print", "printoper"],
        default: void 0
    },
    text: string,
    language: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.ClaimResponse_ProcessNote = ClaimResponse_ProcessNote;