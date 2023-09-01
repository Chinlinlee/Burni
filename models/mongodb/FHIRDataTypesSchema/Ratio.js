const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Ratio.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    numerator: {
        type: Quantity,
        default: void 0
    },
    denominator: {
        type: Quantity,
        default: void 0
    }
});
module.exports.Ratio = Ratio;
