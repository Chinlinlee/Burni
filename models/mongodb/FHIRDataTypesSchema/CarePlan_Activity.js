const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Annotation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CarePlan_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    CarePlan_Activity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CarePlan_Activity.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    outcomeCodeableConcept: {
        type: [CodeableConcept],
        default: void 0
    },
    outcomeReference: {
        type: [Reference],
        default: void 0
    },
    progress: {
        type: [Annotation],
        default: void 0
    },
    reference: {
        type: Reference,
        default: void 0
    },
    detail: {
        type: CarePlan_Detail,
        default: void 0
    }
});
module.exports.CarePlan_Activity = CarePlan_Activity;
