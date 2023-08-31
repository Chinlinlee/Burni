const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestReport_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestReport_Assert
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestReport_Action1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Action1.add({
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
        default: void 0
    },
    assert: {
        type: TestReport_Assert,
        default: void 0
    }
});
module.exports.TestReport_Action1 = TestReport_Action1;
