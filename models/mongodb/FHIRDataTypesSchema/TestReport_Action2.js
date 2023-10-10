const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestReport_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestReport_Action2
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Action2.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    operation: {
        type: TestReport_Operation,
        required: true,
        default: void 0
    }
});
module.exports.TestReport_Action2 = TestReport_Action2;
