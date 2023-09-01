const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SubstancePolymer_StartingMaterial
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstancePolymer_MonomerSet
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_MonomerSet.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    ratioType: {
        type: CodeableConcept,
        default: void 0
    },
    startingMaterial: {
        type: [SubstancePolymer_StartingMaterial],
        default: void 0
    }
});
module.exports.SubstancePolymer_MonomerSet = SubstancePolymer_MonomerSet;
