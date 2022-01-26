const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Signature
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    VerificationResult_Validator
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
VerificationResult_Validator.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    organization: {
        type: Reference,
        required: true,
        default: void 0
    },
    identityCertificate: string,
    attestationSignature: {
        type: Signature,
        default: void 0
    }
});
module.exports.VerificationResult_Validator = VerificationResult_Validator;