const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceAmount_ReferenceRange
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceAmount_ReferenceRange.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    lowLimit: {
        type: Quantity,
        default: void 0
    },
    highLimit: {
        type: Quantity,
        default: void 0
    }
});
module.exports.SubstanceAmount_ReferenceRange = SubstanceAmount_ReferenceRange;