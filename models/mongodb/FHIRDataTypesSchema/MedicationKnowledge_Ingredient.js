const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationKnowledge_Ingredient
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Ingredient.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    itemReference: {
        type: Reference,
        default: void 0
    },
    isActive: boolean,
    strength: {
        type: Ratio,
        default: void 0
    }
});
module.exports.MedicationKnowledge_Ingredient = MedicationKnowledge_Ingredient;