const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const date = require('../FHIRDataTypesSchema/date');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    ValueSet_Include
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ValueSet_Compose
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Compose.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    lockedDate: date,
    inactive: boolean,
    include: {
        type: [ValueSet_Include],
        required: true,
        default: void 0
    },
    exclude: {
        type: [ValueSet_Include],
        default: void 0
    }
});
module.exports.ValueSet_Compose = ValueSet_Compose;