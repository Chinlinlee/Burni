const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    NutritionOrder_Administration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    NutritionOrder_EnteralFormula
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_EnteralFormula.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    baseFormulaType: {
        type: CodeableConcept,
        default: void 0
    },
    baseFormulaProductName: string,
    additiveType: {
        type: CodeableConcept,
        default: void 0
    },
    additiveProductName: string,
    caloricDensity: {
        type: Quantity,
        default: void 0
    },
    routeofAdministration: {
        type: CodeableConcept,
        default: void 0
    },
    administration: {
        type: [NutritionOrder_Administration],
        default: void 0
    },
    maxVolumeToDeliver: {
        type: Quantity,
        default: void 0
    },
    administrationInstruction: string
});
module.exports.NutritionOrder_EnteralFormula = NutritionOrder_EnteralFormula;