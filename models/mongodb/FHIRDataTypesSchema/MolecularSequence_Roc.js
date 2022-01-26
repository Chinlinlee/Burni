const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const decimal = require('../FHIRDataTypesSchema/decimal');

const {
    MolecularSequence_Roc
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_Roc.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    score: {
        type: [integer],
        default: void 0
    },
    numTP: {
        type: [integer],
        default: void 0
    },
    numFP: {
        type: [integer],
        default: void 0
    },
    numFN: {
        type: [integer],
        default: void 0
    },
    precision: {
        type: [decimal],
        default: void 0
    },
    sensitivity: {
        type: [decimal],
        default: void 0
    },
    fMeasure: {
        type: [decimal],
        default: void 0
    }
});
module.exports.MolecularSequence_Roc = MolecularSequence_Roc;