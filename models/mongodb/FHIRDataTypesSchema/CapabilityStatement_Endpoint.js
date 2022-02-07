const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const url = require('../FHIRDataTypesSchema/url');

const {
    CapabilityStatement_Endpoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Endpoint.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    protocol: {
        type: Coding,
        required: true,
        default: void 0
    },
    address: url
});
module.exports.CapabilityStatement_Endpoint = CapabilityStatement_Endpoint;