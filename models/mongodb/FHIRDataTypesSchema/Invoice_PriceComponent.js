const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Invoice_PriceComponent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Invoice_PriceComponent.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["base", "surcharge", "deduction", "discount", "tax", "informational"],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    factor: decimal,
    amount: {
        type: Money,
        default: void 0
    }
});
module.exports.Invoice_PriceComponent = Invoice_PriceComponent;