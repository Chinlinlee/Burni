const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Consent_Actor
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Consent_Actor.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    role: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    reference: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.Consent_Actor = Consent_Actor;