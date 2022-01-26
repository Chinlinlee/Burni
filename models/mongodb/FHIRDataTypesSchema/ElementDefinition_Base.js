const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');

const {
    ElementDefinition_Base
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Base.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    min: unsignedInt,
    max: string
});
module.exports.ElementDefinition_Base = ElementDefinition_Base;