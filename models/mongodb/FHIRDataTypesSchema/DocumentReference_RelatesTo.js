const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DocumentReference_RelatesTo
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DocumentReference_RelatesTo.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: String,
        enum: ["replaces", "transforms", "signs", "appends"],
        default: void 0
    },
    target: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.DocumentReference_RelatesTo = DocumentReference_RelatesTo;