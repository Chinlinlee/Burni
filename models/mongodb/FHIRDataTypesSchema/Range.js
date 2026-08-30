const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Range
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Range.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    low: {
        type: Quantity,
        default: void 0
    },
    high: {
        type: Quantity,
        default: void 0
    }
});
module.exports.Range = Range;