const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    NutritionOrder_Texture
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_Texture.add({
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
    foodType: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.NutritionOrder_Texture = NutritionOrder_Texture;
