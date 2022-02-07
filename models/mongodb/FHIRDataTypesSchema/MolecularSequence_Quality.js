const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    MolecularSequence_Roc
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MolecularSequence_Quality
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_Quality.add({
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
        enum: ["indel", "snp", "unknown"],
        default: void 0
    },
    standardSequence: {
        type: CodeableConcept,
        default: void 0
    },
    start: integer,
    end: integer,
    score: {
        type: Quantity,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    truthTP: decimal,
    queryTP: decimal,
    truthFN: decimal,
    queryFP: decimal,
    gtFP: decimal,
    precision: decimal,
    recall: decimal,
    fScore: decimal,
    roc: {
        type: MolecularSequence_Roc,
        default: void 0
    }
});
module.exports.MolecularSequence_Quality = MolecularSequence_Quality;