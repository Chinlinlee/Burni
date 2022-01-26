const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    SubstanceSourceMaterial_Author
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceSourceMaterial_Hybrid
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceSourceMaterial_OrganismGeneral
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSourceMaterial_Organism
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_Organism.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    family: {
        type: CodeableConcept,
        default: void 0
    },
    genus: {
        type: CodeableConcept,
        default: void 0
    },
    species: {
        type: CodeableConcept,
        default: void 0
    },
    intraspecificType: {
        type: CodeableConcept,
        default: void 0
    },
    intraspecificDescription: string,
    author: {
        type: [SubstanceSourceMaterial_Author],
        default: void 0
    },
    hybrid: {
        type: SubstanceSourceMaterial_Hybrid,
        default: void 0
    },
    organismGeneral: {
        type: SubstanceSourceMaterial_OrganismGeneral,
        default: void 0
    }
});
module.exports.SubstanceSourceMaterial_Organism = SubstanceSourceMaterial_Organism;