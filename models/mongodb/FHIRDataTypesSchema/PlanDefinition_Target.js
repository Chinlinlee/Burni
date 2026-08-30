const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PlanDefinition_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_Target.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    measure: {
        type: CodeableConcept,
        default: void 0
    },
    detailQuantity: {
        type: Quantity,
        default: void 0
    },
    detailRange: {
        type: Range,
        default: void 0
    },
    detailCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    due: {
        type: Duration,
        default: void 0
    }
});
module.exports.PlanDefinition_Target = PlanDefinition_Target;