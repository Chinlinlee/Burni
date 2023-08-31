const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    NutritionOrder_Administration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NutritionOrder_Administration.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    schedule: {
        type: Timing,
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    rateQuantity: {
        type: Quantity,
        default: void 0
    },
    rateRatio: {
        type: Ratio,
        default: void 0
    }
});
module.exports.NutritionOrder_Administration = NutritionOrder_Administration;
