const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MessageHeader_Response
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MessageHeader_Response.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: id,
    code: {
        type: String,
        enum: ["ok", "transient-error", "fatal-error"],
        default: void 0
    },
    details: {
        type: Reference,
        default: void 0
    }
});
module.exports.MessageHeader_Response = MessageHeader_Response;