const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const url = require("../FHIRDataTypesSchema/url");

const {
    MessageHeader_Destination
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MessageHeader_Destination.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    target: {
        type: Reference,
        default: void 0
    },
    endpoint: url,
    receiver: {
        type: Reference,
        default: void 0
    }
});
module.exports.MessageHeader_Destination = MessageHeader_Destination;
