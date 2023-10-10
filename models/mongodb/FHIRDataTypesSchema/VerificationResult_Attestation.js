const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const date = require("../FHIRDataTypesSchema/date");
const string = require("../FHIRDataTypesSchema/string");
const {
    Signature
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    VerificationResult_Attestation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
VerificationResult_Attestation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    who: {
        type: Reference,
        default: void 0
    },
    onBehalfOf: {
        type: Reference,
        default: void 0
    },
    communicationMethod: {
        type: CodeableConcept,
        default: void 0
    },
    date: date,
    sourceIdentityCertificate: string,
    proxyIdentityCertificate: string,
    proxySignature: {
        type: Signature,
        default: void 0
    },
    sourceSignature: {
        type: Signature,
        default: void 0
    }
});
module.exports.VerificationResult_Attestation = VerificationResult_Attestation;
