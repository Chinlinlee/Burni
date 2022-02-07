const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const id = require('../FHIRDataTypesSchema/id');

const {
    ImplementationGuide_Resource
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Resource.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    reference: {
        type: Reference,
        required: true,
        default: void 0
    },
    fhirVersion: {
        type: [String],
        default: void 0
    },
    name: string,
    description: string,
    exampleBoolean: boolean,
    exampleCanonical: string,
    groupingId: id
});
module.exports.ImplementationGuide_Resource = ImplementationGuide_Resource;