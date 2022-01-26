const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const instant = require('../FHIRDataTypesSchema/instant');
const uri = require('../FHIRDataTypesSchema/uri');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Meta
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Meta.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    versionId: id,
    lastUpdated: instant,
    source: uri,
    profile: {
        type: [canonical],
        default: void 0
    },
    security: {
        type: [Coding],
        default: void 0
    },
    tag: {
        type: [Coding],
        default: void 0
    }
});
module.exports.Meta = Meta;