const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const xhtml = require("../FHIRDataTypesSchema/xhtml");

const {
    Narrative
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Narrative.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    status: {
        type: String,
        enum: ["generated", "extensions", "additional", "empty"],
        default: void 0
    },
    div: xhtml
});
module.exports.Narrative = Narrative;
