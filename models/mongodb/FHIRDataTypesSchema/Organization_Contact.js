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
    Organization_Contact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Organization_Contact.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    purpose: {
        type: CodeableConcept,
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
    }
});
module.exports.Organization_Contact = Organization_Contact;
