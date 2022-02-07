const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DiagnosticReport_Media
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DiagnosticReport_Media.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    comment: string,
    link: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.DiagnosticReport_Media = DiagnosticReport_Media;