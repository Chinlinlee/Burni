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
    ExplanationOfBenefit_ProcessNote
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_ProcessNote.add({
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
module.exports.ExplanationOfBenefit_ProcessNote = ExplanationOfBenefit_ProcessNote;