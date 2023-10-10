const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const integer = require("../FHIRDataTypesSchema/integer");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MolecularSequence_Variant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_Variant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    start: integer,
    end: integer,
    observedAllele: string,
    referenceAllele: string,
    cigar: string,
    variantPointer: {
        type: Reference,
        default: void 0
    }
});
module.exports.MolecularSequence_Variant = MolecularSequence_Variant;
