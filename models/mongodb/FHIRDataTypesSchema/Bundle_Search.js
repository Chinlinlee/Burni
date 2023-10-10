const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");

const {
    Bundle_Search
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Bundle_Search.add({
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
        enum: ["match", "include", "outcome"],
        default: void 0
    },
    score: decimal
});
module.exports.Bundle_Search = Bundle_Search;
