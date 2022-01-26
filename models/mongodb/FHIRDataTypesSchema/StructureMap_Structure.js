const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');
const string = require('../FHIRDataTypesSchema/string');

const {
    StructureMap_Structure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Structure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    url: canonical,
    mode: {
        type: String,
        enum: ["source", "queried", "target", "produced"],
        default: void 0
    },
    alias: string,
    documentation: string
});
module.exports.StructureMap_Structure = StructureMap_Structure;