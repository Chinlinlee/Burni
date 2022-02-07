const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    AllergyIntolerance_Reaction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AllergyIntolerance_Reaction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    substance: {
        type: CodeableConcept,
        default: void 0
    },
    manifestation: {
        type: [CodeableConcept],
        required: true,
        default: void 0
    },
    description: string,
    onset: dateTime,
    severity: {
        type: String,
        enum: ["mild", "moderate", "severe"],
        default: void 0
    },
    exposureRoute: {
        type: CodeableConcept,
        default: void 0
    },
    note: {
        type: [Annotation],
        default: void 0
    }
});
module.exports.AllergyIntolerance_Reaction = AllergyIntolerance_Reaction;