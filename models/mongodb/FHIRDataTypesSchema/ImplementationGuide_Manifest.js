const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const url = require('../FHIRDataTypesSchema/url');
const {
    ImplementationGuide_Resource1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ImplementationGuide_Page1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ImplementationGuide_Manifest
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Manifest.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    rendering: url,
    resource: {
        type: [ImplementationGuide_Resource1],
        required: true,
        default: void 0
    },
    page: {
        type: [ImplementationGuide_Page1],
        default: void 0
    },
    image: {
        type: [string],
        default: void 0
    },
    other: {
        type: [string],
        default: void 0
    }
});
module.exports.ImplementationGuide_Manifest = ImplementationGuide_Manifest;