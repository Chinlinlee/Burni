const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProduct_NamePart
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProduct_NamePart.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    part: string,
    type: {
        type: Coding,
        required: true,
        default: void 0
    }
});
module.exports.MedicinalProduct_NamePart = MedicinalProduct_NamePart;
