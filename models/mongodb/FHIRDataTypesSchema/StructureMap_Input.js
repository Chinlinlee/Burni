const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const string = require("../FHIRDataTypesSchema/string");

const {
    StructureMap_Input
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Input.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: id,
    type: string,
    mode: {
        type: String,
        enum: ["source", "target"],
        default: void 0
    },
    documentation: string
});
module.exports.StructureMap_Input = StructureMap_Input;
