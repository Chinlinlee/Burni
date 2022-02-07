const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSourceMaterial_Hybrid
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_Hybrid.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    maternalOrganismId: string,
    maternalOrganismName: string,
    paternalOrganismId: string,
    paternalOrganismName: string,
    hybridType: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.SubstanceSourceMaterial_Hybrid = SubstanceSourceMaterial_Hybrid;