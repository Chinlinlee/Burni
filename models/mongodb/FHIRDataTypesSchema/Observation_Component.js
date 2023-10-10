const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SampledData
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Observation_ReferenceRange
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Observation_Component
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Observation_Component.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueString: string,
    valueBoolean: boolean,
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueRatio: {
        type: Ratio,
        default: void 0
    },
    valueSampledData: {
        type: SampledData,
        default: void 0
    },
    valueTime: string,
    valueDateTime: string,
    valuePeriod: {
        type: Period,
        default: void 0
    },
    dataAbsentReason: {
        type: CodeableConcept,
        default: void 0
    },
    interpretation: {
        type: [CodeableConcept],
        default: void 0
    },
    referenceRange: {
        type: [Observation_ReferenceRange],
        default: void 0
    }
});
module.exports.Observation_Component = Observation_Component;
