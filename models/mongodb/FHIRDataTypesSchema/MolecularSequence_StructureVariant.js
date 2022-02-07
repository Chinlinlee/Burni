const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    MolecularSequence_Outer
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MolecularSequence_Inner
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MolecularSequence_StructureVariant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_StructureVariant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    variantType: {
        type: CodeableConcept,
        default: void 0
    },
    exact: boolean,
    length: integer,
    outer: {
        type: MolecularSequence_Outer,
        default: void 0
    },
    inner: {
        type: MolecularSequence_Inner,
        default: void 0
    }
});
module.exports.MolecularSequence_StructureVariant = MolecularSequence_StructureVariant;