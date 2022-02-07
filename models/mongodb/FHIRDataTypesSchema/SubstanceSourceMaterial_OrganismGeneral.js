const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSourceMaterial_OrganismGeneral
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_OrganismGeneral.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    kingdom: {
        type: CodeableConcept,
        default: void 0
    },
    phylum: {
        type: CodeableConcept,
        default: void 0
    },
    class: {
        type: CodeableConcept,
            default: void 0
    },
    order: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.SubstanceSourceMaterial_OrganismGeneral = SubstanceSourceMaterial_OrganismGeneral;