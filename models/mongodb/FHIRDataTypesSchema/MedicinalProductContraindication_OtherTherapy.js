const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProductContraindication_OtherTherapy
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductContraindication_OtherTherapy.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    therapyRelationshipType: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    medicationCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    medicationReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.MedicinalProductContraindication_OtherTherapy =
    MedicinalProductContraindication_OtherTherapy;
