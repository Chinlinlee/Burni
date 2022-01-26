const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');

const {
    CompartmentDefinition_Resource
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CompartmentDefinition_Resource.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    param: {
        type: [string],
        default: void 0
    },
    documentation: string
});
module.exports.CompartmentDefinition_Resource = CompartmentDefinition_Resource;