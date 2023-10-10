const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    Annotation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Annotation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    authorReference: {
        type: Reference,
        default: void 0
    },
    authorString: string,
    time: dateTime,
    text: markdown
});
module.exports.Annotation = Annotation;
