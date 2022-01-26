const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    TestScript_Action1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestScript_Test
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Test.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    description: string,
    action: {
        type: [TestScript_Action1],
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Test = TestScript_Test;