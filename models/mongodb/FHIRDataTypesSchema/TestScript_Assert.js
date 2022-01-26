const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const code = require('../FHIRDataTypesSchema/code');
const boolean = require('../FHIRDataTypesSchema/boolean');
const id = require('../FHIRDataTypesSchema/id');

const {
    TestScript_Assert
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Assert.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    label: string,
    description: string,
    direction: {
        type: String,
        enum: ["response", "request"],
        default: void 0
    },
    compareToSourceId: string,
    compareToSourceExpression: string,
    compareToSourcePath: string,
    contentType: code,
    expression: string,
    headerField: string,
    minimumId: string,
    navigationLinks: boolean,
    operator: {
        type: String,
        enum: ["equals", "notEquals", "in", "notIn", "greaterThan", "lessThan", "empty", "notEmpty", "contains", "notContains", "eval"],
        default: void 0
    },
    path: string,
    requestMethod: {
        type: String,
        enum: ["delete", "get", "options", "patch", "post", "put", "head"],
        default: void 0
    },
    requestURL: string,
    resource: code,
    response: {
        type: String,
        enum: ["okay", "created", "noContent", "notModified", "bad", "forbidden", "notFound", "methodNotAllowed", "conflict", "gone", "preconditionFailed", "unprocessable"],
        default: void 0
    },
    responseCode: string,
    sourceId: id,
    validateProfileId: id,
    value: string,
    warningOnly: boolean
});
module.exports.TestScript_Assert = TestScript_Assert;