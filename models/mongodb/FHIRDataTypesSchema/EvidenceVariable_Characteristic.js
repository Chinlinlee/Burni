const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    DataRequirement
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TriggerDefinition
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
    EvidenceVariable_Characteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EvidenceVariable_Characteristic.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    definitionReference: {
        type: Reference,
        default: void 0
    },
    definitionCanonical: string,
    definitionCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    definitionExpression: {
        type: Expression,
        default: void 0
    },
    definitionDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    definitionTriggerDefinition: {
        type: TriggerDefinition,
        default: void 0
    },
    usageContext: {
        type: [UsageContext],
        default: void 0
    },
    exclude: boolean,
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
    timeFromStart: {
        type: Duration,
        default: void 0
    },
    groupMeasure: {
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
module.exports.EvidenceVariable_Characteristic =
    EvidenceVariable_Characteristic;
