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
    Provenance_Agent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Provenance_Agent.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    role: {
        type: [CodeableConcept],
        default: void 0
    },
    who: {
        type: Reference,
        required: true,
        default: void 0
    },
    onBehalfOf: {
        type: Reference,
        default: void 0
    }
});
module.exports.Provenance_Agent = Provenance_Agent;