const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestScript_Action2
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestScript_Teardown
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Teardown.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: [TestScript_Action2],
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Teardown = TestScript_Teardown;