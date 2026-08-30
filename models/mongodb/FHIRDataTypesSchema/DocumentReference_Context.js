const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DocumentReference_Context
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DocumentReference_Context.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    encounter: {
        type: [Reference],
        default: void 0
    },
    event: {
        type: [CodeableConcept],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    },
    facilityType: {
        type: CodeableConcept,
        default: void 0
    },
    practiceSetting: {
        type: CodeableConcept,
        default: void 0
    },
    sourcePatientInfo: {
        type: Reference,
        default: void 0
    },
    related: {
        type: [Reference],
        default: void 0
    }
});
module.exports.DocumentReference_Context = DocumentReference_Context;