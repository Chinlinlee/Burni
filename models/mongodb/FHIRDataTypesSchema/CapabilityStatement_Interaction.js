const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    CapabilityStatement_Interaction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Interaction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: String,
        enum: ["read", "vread", "update", "patch", "delete", "history-instance", "history-type", "create", "search-type"],
        default: void 0
    },
    documentation: markdown
});
module.exports.CapabilityStatement_Interaction = CapabilityStatement_Interaction;