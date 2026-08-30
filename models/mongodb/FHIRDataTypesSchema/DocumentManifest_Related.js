const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DocumentManifest_Related
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DocumentManifest_Related.add({
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
    ref: {
        type: Reference,
        default: void 0
    }
});
module.exports.DocumentManifest_Related = DocumentManifest_Related;