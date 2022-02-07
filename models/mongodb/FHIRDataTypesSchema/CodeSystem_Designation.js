const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    CodeSystem_Designation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeSystem_Designation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    language: code,
    use: {
        type: Coding,
        default: void 0
    },
    value: string
});
module.exports.CodeSystem_Designation = CodeSystem_Designation;