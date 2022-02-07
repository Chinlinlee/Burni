const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    GraphDefinition_Target
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    GraphDefinition_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
GraphDefinition_Link.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    sliceName: string,
    min: integer,
    max: string,
    description: string,
    target: {
        type: [GraphDefinition_Target],
        default: void 0
    }
});
module.exports.GraphDefinition_Link = GraphDefinition_Link;