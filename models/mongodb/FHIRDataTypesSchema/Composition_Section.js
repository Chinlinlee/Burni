const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Narrative
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');

const {
    Composition_Section
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Composition_Section.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    title: string,
    code: {
        type: CodeableConcept,
        default: void 0
    },
    author: {
        type: [Reference],
        default: void 0
    },
    focus: {
        type: Reference,
        default: void 0
    },
    text: {
        type: Narrative,
        default: void 0
    },
    mode: code,
    orderedBy: {
        type: CodeableConcept,
        default: void 0
    },
    entry: {
        type: [Reference],
        default: void 0
    },
    emptyReason: {
        type: CodeableConcept,
        default: void 0
    },
    section: {
        type: [this],
        default: void 0
    }
});
module.exports.Composition_Section = Composition_Section;