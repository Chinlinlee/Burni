const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const markdown = require("../FHIRDataTypesSchema/markdown");
const string = require("../FHIRDataTypesSchema/string");

const {
    TestReport_Assert
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Assert.add({
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
    detail: string
});
module.exports.TestReport_Assert = TestReport_Assert;
