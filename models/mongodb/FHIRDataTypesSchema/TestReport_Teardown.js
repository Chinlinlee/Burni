const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TestReport_Action2
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestReport_Teardown
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Teardown.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: [TestReport_Action2],
        required: true,
        default: void 0
    }
});
module.exports.TestReport_Teardown = TestReport_Teardown;
