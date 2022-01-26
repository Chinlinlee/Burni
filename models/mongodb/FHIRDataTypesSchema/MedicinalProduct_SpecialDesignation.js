const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');

const {
    MedicinalProduct_SpecialDesignation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProduct_SpecialDesignation.add({
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
    type: {
        type: CodeableConcept,
        default: void 0
    },
    intendedUse: {
        type: CodeableConcept,
        default: void 0
    },
    indicationCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    indicationReference: {
        type: Reference,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        default: void 0
    },
    date: dateTime,
    species: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.MedicinalProduct_SpecialDesignation = MedicinalProduct_SpecialDesignation;