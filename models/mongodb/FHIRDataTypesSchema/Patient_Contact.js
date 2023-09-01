const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    HumanName
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ContactPoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Address } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Patient_Contact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Patient_Contact.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    relationship: {
        type: [CodeableConcept],
        default: void 0
    },
    name: {
        type: HumanName,
        default: void 0
    },
    telecom: {
        type: [ContactPoint],
        default: void 0
    },
    address: {
        type: Address,
        default: void 0
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", "unknown"],
        default: void 0
    },
    organization: {
        type: Reference,
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Patient_Contact = Patient_Contact;
