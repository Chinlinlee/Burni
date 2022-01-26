const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicinalProductIngredient_Strength
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicinalProductIngredient_Substance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductIngredient_Substance.add({
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
    strength: {
        type: [MedicinalProductIngredient_Strength],
        default: void 0
    }
});
module.exports.MedicinalProductIngredient_Substance = MedicinalProductIngredient_Substance;