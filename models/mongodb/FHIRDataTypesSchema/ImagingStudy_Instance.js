const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const string = require('../FHIRDataTypesSchema/string');

const {
    ImagingStudy_Instance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImagingStudy_Instance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    uid: id,
    sopClass: {
        type: Coding,
        required: true,
        default: void 0
    },
    number: unsignedInt,
    title: string
});
module.exports.ImagingStudy_Instance = ImagingStudy_Instance;