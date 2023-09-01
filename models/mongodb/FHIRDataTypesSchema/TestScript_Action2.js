const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestScript_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestScript_Action2
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Action2.add({
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
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Action2 = TestScript_Action2;
