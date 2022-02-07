const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const canonical = require('../FHIRDataTypesSchema/canonical');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    CapabilityStatement_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Operation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    definition: canonical,
    documentation: markdown
});
module.exports.CapabilityStatement_Operation = CapabilityStatement_Operation;