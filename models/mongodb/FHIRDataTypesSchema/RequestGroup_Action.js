const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const code = require("../FHIRDataTypesSchema/code");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    RelatedArtifact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    RequestGroup_Condition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    RequestGroup_RelatedAction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Age } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    RequestGroup_Action
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RequestGroup_Action.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    prefix: string,
    title: string,
    description: string,
    textEquivalent: string,
    priority: code,
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    documentation: {
        type: [RelatedArtifact],
        default: void 0
    },
    condition: {
        type: [RequestGroup_Condition],
        default: void 0
    },
    relatedAction: {
        type: [RequestGroup_RelatedAction],
        default: void 0
    },
    timingDateTime: string,
    timingAge: {
        type: Age,
        default: void 0
    },
    timingPeriod: {
        type: Period,
        default: void 0
    },
    timingDuration: {
        type: Duration,
        default: void 0
    },
    timingRange: {
        type: Range,
        default: void 0
    },
    timingTiming: {
        type: Timing,
        default: void 0
    },
    participant: {
        type: [Reference],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    groupingBehavior: code,
    selectionBehavior: code,
    requiredBehavior: code,
    precheckBehavior: code,
    cardinalityBehavior: code,
    resource: {
        type: Reference,
        default: void 0
    },
    action: {
        type: [this],
        default: void 0
    }
});
module.exports.RequestGroup_Action = RequestGroup_Action;
