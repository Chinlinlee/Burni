const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceSourceMaterial_PartDescription
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_PartDescription.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    part: {
        type: CodeableConcept,
        default: void 0
    },
    partLocation: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.SubstanceSourceMaterial_PartDescription =
    SubstanceSourceMaterial_PartDescription;
