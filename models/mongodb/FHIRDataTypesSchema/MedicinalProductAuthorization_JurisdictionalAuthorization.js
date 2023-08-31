const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProductAuthorization_JurisdictionalAuthorization
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductAuthorization_JurisdictionalAuthorization.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: [Identifier],
        default: void 0
    },
    country: {
        type: CodeableConcept,
        default: void 0
    },
    jurisdiction: {
        type: [CodeableConcept],
        default: void 0
    },
    legalStatusOfSupply: {
        type: CodeableConcept,
        default: void 0
    },
    validityPeriod: {
        type: Period,
        default: void 0
    }
});
module.exports.MedicinalProductAuthorization_JurisdictionalAuthorization =
    MedicinalProductAuthorization_JurisdictionalAuthorization;
