const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    BiologicallyDerivedProduct_Manipulation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
BiologicallyDerivedProduct_Manipulation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    timeDateTime: string,
    timePeriod: {
        type: Period,
        default: void 0
    }
});
module.exports.BiologicallyDerivedProduct_Manipulation =
    BiologicallyDerivedProduct_Manipulation;
