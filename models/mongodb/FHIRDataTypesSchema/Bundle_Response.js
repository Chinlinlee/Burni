const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const uri = require("../FHIRDataTypesSchema/uri");
const instant = require("../FHIRDataTypesSchema/instant");

const {
    Bundle_Response
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Bundle_Response.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    status: string,
    location: uri,
    etag: string,
    lastModified: instant,
    outcome: {
        type: Object,
        default: void 0
    }
});
module.exports.Bundle_Response = Bundle_Response;
