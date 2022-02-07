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
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    RiskAssessment_Prediction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RiskAssessment_Prediction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    outcome: {
        type: CodeableConcept,
        default: void 0
    },
    probabilityDecimal: {
        type: Number,
        default: void 0
    },
    probabilityRange: {
        type: Range,
        default: void 0
    },
    qualitativeRisk: {
        type: CodeableConcept,
        default: void 0
    },
    relativeRisk: decimal,
    whenPeriod: {
        type: Period,
        default: void 0
    },
    whenRange: {
        type: Range,
        default: void 0
    },
    rationale: string
});
module.exports.RiskAssessment_Prediction = RiskAssessment_Prediction;