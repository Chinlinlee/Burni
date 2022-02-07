const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ProductShelfLife
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ProductShelfLife.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    period: {
        type: Quantity,
        required: true,
        default: void 0
    },
    specialPrecautionsForStorage: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.ProductShelfLife = ProductShelfLife;