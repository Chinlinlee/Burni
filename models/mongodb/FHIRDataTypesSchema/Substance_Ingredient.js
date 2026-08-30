const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Substance_Ingredient
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Substance_Ingredient.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    quantity: {
        type: Ratio,
        default: void 0
    },
    substanceCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    substanceReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.Substance_Ingredient = Substance_Ingredient;