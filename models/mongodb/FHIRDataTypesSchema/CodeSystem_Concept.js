const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeSystem_Designation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeSystem_Property1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CodeSystem_Concept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeSystem_Concept.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    display: string,
    definition: string,
    designation: {
        type: [CodeSystem_Designation],
        default: void 0
    },
    property: {
        type: [CodeSystem_Property1],
        default: void 0
    },
    concept: {
        type: [this],
        default: void 0
    }
});
module.exports.CodeSystem_Concept = CodeSystem_Concept;