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
    NutritionOrder_Nutrient
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_Nutrient.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    modifier: {
        type: CodeableConcept,
        default: void 0
    },
    amount: {
        type: Quantity,
        default: void 0
    }
});
module.exports.NutritionOrder_Nutrient = NutritionOrder_Nutrient;