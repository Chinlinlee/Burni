const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');

const {
    MolecularSequence_Inner
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_Inner.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    start: integer,
    end: integer
});
module.exports.MolecularSequence_Inner = MolecularSequence_Inner;