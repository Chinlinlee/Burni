const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const code = require('../FHIRDataTypesSchema/code');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    Contract_ContentDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_ContentDefinition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    subType: {
        type: CodeableConcept,
        default: void 0
    },
    publisher: {
        type: Reference,
        default: void 0
    },
    publicationDate: dateTime,
    publicationStatus: code,
    copyright: markdown
});
module.exports.Contract_ContentDefinition = Contract_ContentDefinition;