const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Linkage_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Linkage_Item.add({
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
        enum: ["source", "alternate", "historical"],
        default: void 0
    },
    resource: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.Linkage_Item = Linkage_Item;