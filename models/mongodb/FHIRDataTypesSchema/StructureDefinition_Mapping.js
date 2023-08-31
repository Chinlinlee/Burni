const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const uri = require("../FHIRDataTypesSchema/uri");
const string = require("../FHIRDataTypesSchema/string");

const {
    StructureDefinition_Mapping
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureDefinition_Mapping.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identity: id,
    uri: uri,
    name: string,
    comment: string
});
module.exports.StructureDefinition_Mapping = StructureDefinition_Mapping;
