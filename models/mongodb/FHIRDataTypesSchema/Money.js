const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const code = require("../FHIRDataTypesSchema/code");

const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Money.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    value: decimal,
    currency: code
});
module.exports.Money = Money;
