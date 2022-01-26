const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');
const code = require('../FHIRDataTypesSchema/code');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    Coding
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Coding.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    system: uri,
    version: string,
    code: code,
    display: string,
    userSelected: boolean
});
module.exports.Coding = Coding;