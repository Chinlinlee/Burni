const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Invoice_PriceComponent
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Invoice_LineItem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Invoice_LineItem.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    chargeItemReference: {
        type: Reference,
        default: void 0
    },
    chargeItemCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    priceComponent: {
        type: [Invoice_PriceComponent],
        default: void 0
    }
});
module.exports.Invoice_LineItem = Invoice_LineItem;