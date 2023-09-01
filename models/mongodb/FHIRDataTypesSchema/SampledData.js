const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const string = require("../FHIRDataTypesSchema/string");

const {
    SampledData
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SampledData.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    origin: {
        type: Quantity,
        required: true,
        default: void 0
    },
    period: decimal,
    factor: decimal,
    lowerLimit: decimal,
    upperLimit: decimal,
    dimensions: positiveInt,
    data: string
});
module.exports.SampledData = SampledData;
