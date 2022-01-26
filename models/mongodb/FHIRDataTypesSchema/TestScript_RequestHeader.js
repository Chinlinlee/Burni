const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    TestScript_RequestHeader
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_RequestHeader.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    field: string,
    value: string
});
module.exports.TestScript_RequestHeader = TestScript_RequestHeader;