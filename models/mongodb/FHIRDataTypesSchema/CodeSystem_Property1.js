const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    CodeSystem_Property1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeSystem_Property1.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    valueCode: string,
    valueCoding: {
        type: Coding,
        default: void 0
    },
    valueString: string,
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueBoolean: boolean,
    valueDateTime: string,
    valueDecimal: {
        type: Number,
        default: void 0
    }
});
module.exports.CodeSystem_Property1 = CodeSystem_Property1;