const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Bundle_Link
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const {
    Bundle_Search
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Bundle_Request
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Bundle_Response
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Bundle_Entry
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Bundle_Entry.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    link: {
        type: [Bundle_Link],
        default: void 0
    },
    fullUrl: uri,
    resource: {
        type: Object,
        default: void 0
    },
    search: {
        type: Bundle_Search,
        default: void 0
    },
    request: {
        type: Bundle_Request,
        default: void 0
    },
    response: {
        type: Bundle_Response,
        default: void 0
    }
});
module.exports.Bundle_Entry = Bundle_Entry;