const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestScript_Destination
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Destination.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    index: integer,
    profile: {
        type: Coding,
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Destination = TestScript_Destination;