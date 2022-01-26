const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    TerminologyCapabilities_Version
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    TerminologyCapabilities_CodeSystem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_CodeSystem.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    uri: canonical,
    version: {
        type: [TerminologyCapabilities_Version],
        default: void 0
    },
    subsumption: boolean
});
module.exports.TerminologyCapabilities_CodeSystem = TerminologyCapabilities_CodeSystem;