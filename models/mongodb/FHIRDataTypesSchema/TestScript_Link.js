const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');

const {
    TestScript_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Link.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    url: uri,
    description: string
});
module.exports.TestScript_Link = TestScript_Link;