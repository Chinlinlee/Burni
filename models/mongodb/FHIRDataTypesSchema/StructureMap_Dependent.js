const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const string = require("../FHIRDataTypesSchema/string");

const {
    StructureMap_Dependent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Dependent.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: id,
    variable: {
        type: [string],
        default: void 0
    }
});
module.exports.StructureMap_Dependent = StructureMap_Dependent;
