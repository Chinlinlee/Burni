const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const base64Binary = require("../FHIRDataTypesSchema/base64Binary");
const url = require("../FHIRDataTypesSchema/url");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const string = require("../FHIRDataTypesSchema/string");
const dateTime = require("../FHIRDataTypesSchema/dateTime");

const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Attachment.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    contentType: code,
    language: code,
    data: base64Binary,
    url: url,
    size: unsignedInt,
    hash: base64Binary,
    title: string,
    creation: dateTime
});
module.exports.Attachment = Attachment;
