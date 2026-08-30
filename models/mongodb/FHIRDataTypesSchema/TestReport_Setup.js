const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestReport_Action
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestReport_Setup
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Setup.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: [TestReport_Action],
        required: true,
        default: void 0
    }
});
module.exports.TestReport_Setup = TestReport_Setup;