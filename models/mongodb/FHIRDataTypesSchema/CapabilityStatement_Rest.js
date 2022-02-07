const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    CapabilityStatement_Security
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_Resource
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_Interaction1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_SearchParam
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_Operation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    CapabilityStatement_Rest
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Rest.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    mode: {
        type: String,
        enum: ["client", "server"],
        default: void 0
    },
    documentation: markdown,
    security: {
        type: CapabilityStatement_Security,
        default: void 0
    },
    resource: {
        type: [CapabilityStatement_Resource],
        default: void 0
    },
    interaction: {
        type: [CapabilityStatement_Interaction1],
        default: void 0
    },
    searchParam: {
        type: [CapabilityStatement_SearchParam],
        default: void 0
    },
    operation: {
        type: [CapabilityStatement_Operation],
        default: void 0
    },
    compartment: {
        type: [canonical],
        default: void 0
    }
});
module.exports.CapabilityStatement_Rest = CapabilityStatement_Rest;