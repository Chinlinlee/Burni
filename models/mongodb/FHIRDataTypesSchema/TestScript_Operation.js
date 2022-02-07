const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');
const integer = require('../FHIRDataTypesSchema/integer');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    TestScript_RequestHeader
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');

const {
    TestScript_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Operation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: Coding,
        default: void 0
    },
    resource: code,
    label: string,
    description: string,
    accept: code,
    contentType: code,
    destination: integer,
    encodeRequestUrl: boolean,
    method: {
        type: String,
        enum: ["delete", "get", "options", "patch", "post", "put", "head"],
        default: void 0
    },
    origin: integer,
    params: string,
    requestHeader: {
        type: [TestScript_RequestHeader],
        default: void 0
    },
    requestId: id,
    responseId: id,
    sourceId: id,
    targetId: id,
    url: string
});
module.exports.TestScript_Operation = TestScript_Operation;