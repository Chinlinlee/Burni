const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestScript_Action
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestScript_Setup
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Setup.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: [TestScript_Action],
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Setup = TestScript_Setup;
