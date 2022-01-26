const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    Observation_ReferenceRange
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Observation_ReferenceRange.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    low: {
        type: Quantity,
        default: void 0
    },
    high: {
        type: Quantity,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    appliesTo: {
        type: [CodeableConcept],
        default: void 0
    },
    age: {
        type: Range,
        default: void 0
    },
    text: string
});
module.exports.Observation_ReferenceRange = Observation_ReferenceRange;