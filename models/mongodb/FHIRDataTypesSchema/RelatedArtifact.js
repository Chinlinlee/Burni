const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const markdown = require("../FHIRDataTypesSchema/markdown");
const url = require("../FHIRDataTypesSchema/url");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const canonical = require("../FHIRDataTypesSchema/canonical");

const {
    RelatedArtifact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RelatedArtifact.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: [
            "documentation",
            "justification",
            "citation",
            "predecessor",
            "successor",
            "derived-from",
            "depends-on",
            "composed-of"
        ],
        default: void 0
    },
    label: string,
    display: string,
    citation: markdown,
    url: url,
    document: {
        type: Attachment,
        default: void 0
    },
    resource: canonical
});
module.exports.RelatedArtifact = RelatedArtifact;
