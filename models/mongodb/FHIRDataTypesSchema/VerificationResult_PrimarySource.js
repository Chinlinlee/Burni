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
const dateTime = require("../FHIRDataTypesSchema/dateTime");

const {
    VerificationResult_PrimarySource
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
VerificationResult_PrimarySource.add({
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
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    communicationMethod: {
        type: [CodeableConcept],
        default: void 0
    },
    validationStatus: {
        type: CodeableConcept,
        default: void 0
    },
    validationDate: dateTime,
    canPushUpdates: {
        type: CodeableConcept,
        default: void 0
    },
    pushTypeAvailable: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.VerificationResult_PrimarySource =
    VerificationResult_PrimarySource;
