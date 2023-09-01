const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const canonical = require("../FHIRDataTypesSchema/canonical");
const uri = require("../FHIRDataTypesSchema/uri");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    CarePlan_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CarePlan_Detail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    kind: code,
    instantiatesCanonical: {
        type: [canonical],
        default: void 0
    },
    instantiatesUri: {
        type: [uri],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    reasonCode: {
        type: [CodeableConcept],
        default: void 0
    },
    reasonReference: {
        type: [Reference],
        default: void 0
    },
    goal: {
        type: [Reference],
        default: void 0
    },
    status: {
        type: String,
        enum: [
            "not-started",
            "scheduled",
            "in-progress",
            "on-hold",
            "completed",
            "cancelled",
            "stopped",
            "unknown",
            "entered-in-error"
        ],
        default: void 0
    },
    statusReason: {
        type: CodeableConcept,
        default: void 0
    },
    doNotPerform: boolean,
    scheduledTiming: {
        type: Timing,
        default: void 0
    },
    scheduledPeriod: {
        type: Period,
        default: void 0
    },
    scheduledString: string,
    location: {
        type: Reference,
        default: void 0
    },
    performer: {
        type: [Reference],
        default: void 0
    },
    productCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    productReference: {
        type: Reference,
        default: void 0
    },
    dailyAmount: {
        type: Quantity,
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    description: string
});
module.exports.CarePlan_Detail = CarePlan_Detail;
