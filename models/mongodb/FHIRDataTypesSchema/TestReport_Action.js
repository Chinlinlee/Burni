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
    TestReport_Action
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Action.add({
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
module.exports.TestReport_Action = TestReport_Action;
