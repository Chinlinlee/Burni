const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    SubstanceAmount
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstancePolymer_StartingMaterial
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_StartingMaterial.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    material: {
        type: CodeableConcept,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    isDefining: boolean,
    amount: {
        type: SubstanceAmount,
        default: void 0
    }
});
module.exports.SubstancePolymer_StartingMaterial =
    SubstancePolymer_StartingMaterial;
