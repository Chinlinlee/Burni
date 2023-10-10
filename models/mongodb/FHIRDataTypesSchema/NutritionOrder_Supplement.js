const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    NutritionOrder_Supplement
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_Supplement.add({
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
        default: void 0
    },
    productName: string,
    schedule: {
        type: [Timing],
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    instruction: string
});
module.exports.NutritionOrder_Supplement = NutritionOrder_Supplement;
