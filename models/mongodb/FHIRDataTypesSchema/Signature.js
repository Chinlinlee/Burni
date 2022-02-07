const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const instant = require('../FHIRDataTypesSchema/instant');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const base64Binary = require('../FHIRDataTypesSchema/base64Binary');

const {
    Signature
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Signature.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: [Coding],
        required: true,
        default: void 0
    },
    when: instant,
    who: {
        type: Reference,
        required: true,
        default: void 0
    },
    onBehalfOf: {
        type: Reference,
        default: void 0
    },
    targetFormat: code,
    sigFormat: code,
    data: base64Binary
});
module.exports.Signature = Signature;