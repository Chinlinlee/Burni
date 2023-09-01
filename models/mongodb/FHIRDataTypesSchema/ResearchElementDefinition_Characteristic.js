const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    DataRequirement
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    UsageContext
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ResearchElementDefinition_Characteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ResearchElementDefinition_Characteristic.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    definitionCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    definitionCanonical: string,
    definitionExpression: {
        type: Expression,
        default: void 0
    },
    definitionDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    usageContext: {
        type: [UsageContext],
        default: void 0
    },
    exclude: boolean,
    unitOfMeasure: {
        type: CodeableConcept,
        default: void 0
    },
    studyEffectiveDescription: string,
    studyEffectiveDateTime: string,
    studyEffectivePeriod: {
        type: Period,
        default: void 0
    },
    studyEffectiveDuration: {
        type: Duration,
        default: void 0
    },
    studyEffectiveTiming: {
        type: Timing,
        default: void 0
    },
    studyEffectiveTimeFromStart: {
        type: Duration,
        default: void 0
    },
    studyEffectiveGroupMeasure: {
        type: String,
        enum: [
            "mean",
            "median",
            "mean-of-mean",
            "mean-of-median",
            "median-of-mean",
            "median-of-median"
        ],
        default: void 0
    },
    participantEffectiveDescription: string,
    participantEffectiveDateTime: string,
    participantEffectivePeriod: {
        type: Period,
        default: void 0
    },
    participantEffectiveDuration: {
        type: Duration,
        default: void 0
    },
    participantEffectiveTiming: {
        type: Timing,
        default: void 0
    },
    participantEffectiveTimeFromStart: {
        type: Duration,
        default: void 0
    },
    participantEffectiveGroupMeasure: {
        type: String,
        enum: [
            "mean",
            "median",
            "mean-of-mean",
            "mean-of-median",
            "median-of-mean",
            "median-of-median"
        ],
        default: void 0
    }
});
module.exports.ResearchElementDefinition_Characteristic =
    ResearchElementDefinition_Characteristic;
