const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Immunization_ProtocolApplied
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Immunization_ProtocolApplied.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    series: string,
    authority: {
        type: Reference,
        default: void 0
    },
    targetDisease: {
        type: [CodeableConcept],
        default: void 0
    },
    doseNumberPositiveInt: {
        type: Number,
        default: void 0
    },
    doseNumberString: string,
    seriesDosesPositiveInt: {
        type: Number,
        default: void 0
    },
    seriesDosesString: string
});
module.exports.Immunization_ProtocolApplied = Immunization_ProtocolApplied;