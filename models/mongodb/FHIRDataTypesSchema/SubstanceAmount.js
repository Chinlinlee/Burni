const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceAmount_ReferenceRange
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceAmount
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceAmount.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountRange: {
        type: Range,
        default: void 0
    },
    amountString: string,
    amountType: {
        type: CodeableConcept,
        default: void 0
    },
    amountText: string,
    referenceRange: {
        type: SubstanceAmount_ReferenceRange,
        default: void 0
    }
});
module.exports.SubstanceAmount = SubstanceAmount;