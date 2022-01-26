const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');
const id = require('../FHIRDataTypesSchema/id');
const string = require('../FHIRDataTypesSchema/string');

const {
    ImplementationGuide_DependsOn
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_DependsOn.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    uri: canonical,
    packageId: id,
    version: string
});
module.exports.ImplementationGuide_DependsOn = ImplementationGuide_DependsOn;