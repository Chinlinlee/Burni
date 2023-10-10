const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    RelatedArtifact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    PlanDefinition_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    PlanDefinition_Goal
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_Goal.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        default: void 0
    },
    description: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    priority: {
        type: CodeableConcept,
        default: void 0
    },
    start: {
        type: CodeableConcept,
        default: void 0
    },
    addresses: {
        type: [CodeableConcept],
        default: void 0
    },
    documentation: {
        type: [RelatedArtifact],
        default: void 0
    },
    target: {
        type: [PlanDefinition_Target],
        default: void 0
    }
});
module.exports.PlanDefinition_Goal = PlanDefinition_Goal;
