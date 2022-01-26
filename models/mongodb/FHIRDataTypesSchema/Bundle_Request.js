const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');
const instant = require('../FHIRDataTypesSchema/instant');

const {
    Bundle_Request
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Bundle_Request.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    method: {
        type: String,
        enum: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"],
        default: void 0
    },
    url: uri,
    ifNoneMatch: string,
    ifModifiedSince: instant,
    ifMatch: string,
    ifNoneExist: string
});
module.exports.Bundle_Request = Bundle_Request;