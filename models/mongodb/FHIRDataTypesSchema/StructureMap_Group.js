const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const string = require("../FHIRDataTypesSchema/string");
const {
    StructureMap_Input
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    StructureMap_Rule
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    StructureMap_Group
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Group.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: id,
    extends: id,
    typeMode: {
        type: String,
        enum: ["none", "types", "type-and-types"],
        default: void 0
    },
    documentation: string,
    input: {
        type: [StructureMap_Input],
        required: true,
        default: void 0
    },
    rule: {
        type: [StructureMap_Rule],
        required: true,
        default: void 0
    }
});
module.exports.StructureMap_Group = StructureMap_Group;
