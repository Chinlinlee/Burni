const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceSourceMaterial_FractionDescription
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_FractionDescription.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    fraction: string,
    materialType: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.SubstanceSourceMaterial_FractionDescription =
    SubstanceSourceMaterial_FractionDescription;
