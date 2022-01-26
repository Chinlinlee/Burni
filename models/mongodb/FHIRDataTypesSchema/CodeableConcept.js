const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeableConcept.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    coding: {
        type: [Coding],
        default: void 0
    },
    text: string
});
module.exports.CodeableConcept = CodeableConcept;