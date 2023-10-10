const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    ContactPoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const url = require("../FHIRDataTypesSchema/url");

const {
    MessageHeader_Source
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MessageHeader_Source.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    software: string,
    version: string,
    contact: {
        type: ContactPoint,
        default: void 0
    },
    endpoint: url
});
module.exports.MessageHeader_Source = MessageHeader_Source;
