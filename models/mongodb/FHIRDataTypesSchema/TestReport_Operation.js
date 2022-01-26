const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');
const uri = require('../FHIRDataTypesSchema/uri');

const {
    TestReport_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Operation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    result: {
        type: String,
        enum: ["pass", "skip", "fail", "warning", "error"],
        default: void 0
    },
    message: markdown,
    detail: uri
});
module.exports.TestReport_Operation = TestReport_Operation;