const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');

const {
    MolecularSequence_ReferenceSeq
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_ReferenceSeq.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    chromosome: {
        type: CodeableConcept,
        default: void 0
    },
    genomeBuild: string,
    orientation: {
        type: String,
        enum: ["sense", "antisense"],
        default: void 0
    },
    referenceSeqId: {
        type: CodeableConcept,
        default: void 0
    },
    referenceSeqPointer: {
        type: Reference,
        default: void 0
    },
    referenceSeqString: string,
    strand: {
        type: String,
        enum: ["watson", "crick"],
        default: void 0
    },
    windowStart: integer,
    windowEnd: integer
});
module.exports.MolecularSequence_ReferenceSeq = MolecularSequence_ReferenceSeq;