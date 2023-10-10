const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    ImplementationGuide_Page1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Page1.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    title: string,
    anchor: {
        type: [string],
        default: void 0
    }
});
module.exports.ImplementationGuide_Page1 = ImplementationGuide_Page1;
