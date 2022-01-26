const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ChargeItemDefinition_Applicability
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ChargeItemDefinition_PriceComponent
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ChargeItemDefinition_PropertyGroup
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ChargeItemDefinition_PropertyGroup.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    applicability: {
        type: [ChargeItemDefinition_Applicability],
        default: void 0
    },
    priceComponent: {
        type: [ChargeItemDefinition_PriceComponent],
        default: void 0
    }
});
module.exports.ChargeItemDefinition_PropertyGroup = ChargeItemDefinition_PropertyGroup;