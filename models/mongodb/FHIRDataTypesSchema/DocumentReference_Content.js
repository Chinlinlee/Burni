const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DocumentReference_Content
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DocumentReference_Content.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    attachment: {
        type: Attachment,
        required: true,
        default: void 0
    },
    format: {
        type: Coding,
        default: void 0
    }
});
module.exports.DocumentReference_Content = DocumentReference_Content;