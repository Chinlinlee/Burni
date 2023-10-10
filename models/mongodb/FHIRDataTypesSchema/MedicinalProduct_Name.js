const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    MedicinalProduct_NamePart
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    MedicinalProduct_CountryLanguage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProduct_Name
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProduct_Name.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    productName: string,
    namePart: {
        type: [MedicinalProduct_NamePart],
        default: void 0
    },
    countryLanguage: {
        type: [MedicinalProduct_CountryLanguage],
        default: void 0
    }
});
module.exports.MedicinalProduct_Name = MedicinalProduct_Name;
