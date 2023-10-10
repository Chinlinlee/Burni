const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    MedicinalProductIngredient_ReferenceStrength
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductIngredient_ReferenceStrength.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    substance: {
        type: CodeableConcept,
        default: void 0
    },
    strength: {
        type: Ratio,
        required: true,
        default: void 0
    },
    strengthLowLimit: {
        type: Ratio,
        default: void 0
    },
    measurementPoint: string,
    country: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.MedicinalProductIngredient_ReferenceStrength =
    MedicinalProductIngredient_ReferenceStrength;
