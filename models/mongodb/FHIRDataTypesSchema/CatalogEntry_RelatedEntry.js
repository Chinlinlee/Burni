const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CatalogEntry_RelatedEntry
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CatalogEntry_RelatedEntry.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    relationtype: {
        type: String,
        enum: ["triggers", "is-replaced-by"],
        default: void 0
    },
    item: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.CatalogEntry_RelatedEntry = CatalogEntry_RelatedEntry;