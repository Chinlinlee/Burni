const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceSpecification_MolecularWeight
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSpecification_Isotope
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Isotope.add({
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
    name: {
        type: CodeableConcept,
        default: void 0
    },
    substitution: {
        type: CodeableConcept,
        default: void 0
    },
    halfLife: {
        type: Quantity,
        default: void 0
    },
    molecularWeight: {
        type: SubstanceSpecification_MolecularWeight,
        default: void 0
    }
});
module.exports.SubstanceSpecification_Isotope = SubstanceSpecification_Isotope;