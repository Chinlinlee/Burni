const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicinalProductPackaged_BatchIdentifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPackaged_BatchIdentifier.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    outerPackaging: {
        type: Identifier,
        required: true,
        default: void 0
    },
    immediatePackaging: {
        type: Identifier,
        default: void 0
    }
});
module.exports.MedicinalProductPackaged_BatchIdentifier = MedicinalProductPackaged_BatchIdentifier;