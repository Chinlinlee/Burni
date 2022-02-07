const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const {
    StructureMap_Source
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    StructureMap_Target
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    StructureMap_Dependent
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    StructureMap_Rule
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Rule.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: id,
    source: {
        type: [StructureMap_Source],
        required: true,
        default: void 0
    },
    target: {
        type: [StructureMap_Target],
        default: void 0
    },
    rule: {
        type: [this],
        default: void 0
    },
    dependent: {
        type: [StructureMap_Dependent],
        default: void 0
    },
    documentation: string
});
module.exports.StructureMap_Rule = StructureMap_Rule;