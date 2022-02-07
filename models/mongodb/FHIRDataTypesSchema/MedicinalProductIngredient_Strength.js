const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicinalProductIngredient_ReferenceStrength
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicinalProductIngredient_Strength
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductIngredient_Strength.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    presentation: {
        type: Ratio,
        required: true,
        default: void 0
    },
    presentationLowLimit: {
        type: Ratio,
        default: void 0
    },
    concentration: {
        type: Ratio,
        default: void 0
    },
    concentrationLowLimit: {
        type: Ratio,
        default: void 0
    },
    measurementPoint: string,
    country: {
        type: [CodeableConcept],
        default: void 0
    },
    referenceStrength: {
        type: [MedicinalProductIngredient_ReferenceStrength],
        default: void 0
    }
});
module.exports.MedicinalProductIngredient_Strength = MedicinalProductIngredient_Strength;