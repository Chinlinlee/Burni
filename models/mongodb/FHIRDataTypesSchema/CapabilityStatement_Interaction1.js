const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    CapabilityStatement_Interaction1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Interaction1.add({
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
        enum: ["transaction", "batch", "search-system", "history-system"],
        default: void 0
    },
    documentation: markdown
});
module.exports.CapabilityStatement_Interaction1 =
    CapabilityStatement_Interaction1;
