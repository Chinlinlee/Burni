const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Signature
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Contract_Signer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Signer.add({
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
        required: true,
        default: void 0
    },
    party: {
        type: Reference,
        required: true,
        default: void 0
    },
    signature: {
        type: [Signature],
        required: true,
        default: void 0
    }
});
module.exports.Contract_Signer = Contract_Signer;