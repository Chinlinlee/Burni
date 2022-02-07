const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Consent_Actor
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Consent_Data
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Consent_Provision
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Consent_Provision.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["deny", "permit"],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    },
    actor: {
        type: [Consent_Actor],
        default: void 0
    },
    action: {
        type: [CodeableConcept],
        default: void 0
    },
    securityLabel: {
        type: [Coding],
        default: void 0
    },
    purpose: {
        type: [Coding],
        default: void 0
    },
    class: {
        type: [Coding],
            default: void 0
    },
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    dataPeriod: {
        type: Period,
        default: void 0
    },
    data: {
        type: [Consent_Data],
        default: void 0
    },
    provision: {
        type: [this],
        default: void 0
    }
});
module.exports.Consent_Provision = Consent_Provision;