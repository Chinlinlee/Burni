const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    SpecimenDefinition_Handling
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SpecimenDefinition_Handling.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    temperatureQualifier: {
        type: CodeableConcept,
        default: void 0
    },
    temperatureRange: {
        type: Range,
        default: void 0
    },
    maxDuration: {
        type: Duration,
        default: void 0
    },
    instruction: string
});
module.exports.SpecimenDefinition_Handling = SpecimenDefinition_Handling;