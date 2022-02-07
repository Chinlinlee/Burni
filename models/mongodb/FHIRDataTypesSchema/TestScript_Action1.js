const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestScript_Operation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestScript_Assert
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestScript_Action1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Action1.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    operation: {
        type: TestScript_Operation,
        default: void 0
    },
    assert: {
        type: TestScript_Assert,
        default: void 0
    }
});
module.exports.TestScript_Action1 = TestScript_Action1;