const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicationKnowledge_Cost
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Cost.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    source: string,
    cost: {
        type: Money,
        required: true,
        default: void 0
    }
});
module.exports.MedicationKnowledge_Cost = MedicationKnowledge_Cost;
