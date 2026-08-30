const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Population
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Population.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    ageRange: {
        type: Range,
        default: void 0
    },
    ageCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    gender: {
        type: CodeableConcept,
        default: void 0
    },
    race: {
        type: CodeableConcept,
        default: void 0
    },
    physiologicalCondition: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Population = Population;