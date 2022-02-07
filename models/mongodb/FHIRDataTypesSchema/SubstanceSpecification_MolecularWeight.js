const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSpecification_MolecularWeight
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_MolecularWeight.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    amount: {
        type: Quantity,
        default: void 0
    }
});
module.exports.SubstanceSpecification_MolecularWeight = SubstanceSpecification_MolecularWeight;