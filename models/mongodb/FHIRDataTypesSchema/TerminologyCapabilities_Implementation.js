const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const url = require('../FHIRDataTypesSchema/url');

const {
    TerminologyCapabilities_Implementation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Implementation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    url: url
});
module.exports.TerminologyCapabilities_Implementation = TerminologyCapabilities_Implementation;