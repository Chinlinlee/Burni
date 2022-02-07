const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    NutritionOrder_Nutrient
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    NutritionOrder_Texture
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    NutritionOrder_OralDiet
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_OralDiet.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    schedule: {
        type: [Timing],
        default: void 0
    },
    nutrient: {
        type: [NutritionOrder_Nutrient],
        default: void 0
    },
    texture: {
        type: [NutritionOrder_Texture],
        default: void 0
    },
    fluidConsistencyType: {
        type: [CodeableConcept],
        default: void 0
    },
    instruction: string
});
module.exports.NutritionOrder_OralDiet = NutritionOrder_OralDiet;