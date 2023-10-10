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
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_Related
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Related.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    claim: {
        type: Reference,
        default: void 0
    },
    relationship: {
        type: CodeableConcept,
        default: void 0
    },
    reference: {
        type: Identifier,
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Related = ExplanationOfBenefit_Related;
