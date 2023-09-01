const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProduct_CountryLanguage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProduct_CountryLanguage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    country: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    jurisdiction: {
        type: CodeableConcept,
        default: void 0
    },
    language: {
        type: CodeableConcept,
        required: true,
        default: void 0
    }
});
module.exports.MedicinalProduct_CountryLanguage =
    MedicinalProduct_CountryLanguage;
